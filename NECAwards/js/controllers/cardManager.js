'use strict';
const CHANCE_FOR_GESTURE_CARD = 0.01;
const CHANCE_FOR_FACT_CARD = 0.03;

const CARD_COLUMNS = 9;
const CARD_ROWS = 5;

class CardManager {
    constructor() {
        this.NUM_CARDS = CARD_COLUMNS * CARD_ROWS;
        this.searchCardIndex = this.NUM_CARDS - 1;

        this.allCardDataFront = [];
        this.allCardDataBack = [];
    }

    // =====================================================================================================================
    // All getters
    // =====================================================================================================================

    getCurrentAwardIds() {
        // TODO this takes all awards, front and back. In the future, it should only take the ones visible at the moment
        return this.allCardDataBack.concat(this.allCardDataFront)
            .filter(function(d) { return !!d && d.type === CardDirectory.CARD_TYPE_AWARD })
            .map(function(data) { return data.awardData.award.awardId; });
    }

    getCardDataPair(cardIdx) {
        return {
            "front": this.allCardDataFront[cardIdx],
            "back": this.allCardDataBack[cardIdx]
        }
    }

    static getCardRowCol(cardIdx) {
        return {
            "r": Math.floor(cardIdx / CARD_COLUMNS),
            "c": cardIdx % CARD_COLUMNS};
    }

    getCurrentGestureCards() {
        return this.allCardDataBack.concat(this.allCardDataFront)
            .filter(function(d) { return !!d && d.type === CardDirectory.CARD_TYPE_GESTURE })
            .map(function(data) { return data.gestureType; });
    }

    getCurrentFactCards() {
        return this.allCardDataBack.concat(this.allCardDataFront)
            .filter(function(d) { return !!d && d.type === CardDirectory.CARD_TYPE_FACT })
            .map(function(data) { return data.imageUrl; });
    }

    getSearchCardState() {
        return this.allCardDataFront[this.searchCardIndex].getSearchState();
    }

    getSearchCard() {
        return this.allCardDataFront[this.searchCardIndex];
    }


    // =================================================================================================================
    // All Initializers
    // =================================================================================================================

    async initCards(cardData) {
        // For all non-search cards...
        for (let cardIdx = 0 ; cardIdx < this.NUM_CARDS; ++cardIdx) {

            // Skip if we are on the search card.
            if (cardIdx === this.searchCardIndex) {
                continue;
            }

            const cardIdxConst = cardIdx;
            const nCardData = await this.generateRandomInfoCardData(cardData[cardIdx]);
            // Place in the list of card data
            this.allCardDataFront.push(nCardData);

            // Update the HTML
            updateHTMLCard_AllTypes(cardIdxConst, true, nCardData);
        }

        // For the search card...
        this.assignSearchCard(this.searchCardIndex);

        // TODO move this html code.
        $searchCardFront = $(".front.search");
        $searchCardBack = $(".back.search");

        updateHTMLCard_Search();
    }

    // Generates a new "information" card randomly selected from GESTURE, FACT, or AWARD types.
    // Second argument: suppliedAwardData is optional, use it only if we already have a card data to assign to an award card
    // If it is not supplied, then we will call backend for a random award.
    async generateRandomInfoCardData(suppliedAwardData) {
        let random = Math.random();

        if (random <= CHANCE_FOR_GESTURE_CARD
                && this.getCurrentGestureCards().length < CardDirectory.GESTURE_LIST.length) {
            // Gesture Card
            return this.newUniqueGestureCard();
        } else if (CHANCE_FOR_GESTURE_CARD < random
                && random <= (CHANCE_FOR_GESTURE_CARD + CHANCE_FOR_FACT_CARD)
                && this.getCurrentFactCards().length < CardDirectory.FACT_LIST.length) {
            // Fact Card
            return this.newUniqueFactCard();
        } else {
            // Award Card
            if (suppliedAwardData) {
                return new AwardCard(suppliedAwardData);
            } else {
                // Post for a new random card data
                try {
                    const data = await postForRandomAwards(1, this.getCurrentAwardIds());
                    return new AwardCard(data.data[0]);
                } catch (e) {
                    console.log(e);
                }

                // TODO try catch here
            }
        }
    }

    newUniqueGestureCard() {
        let currentGestureTypes = this.getCurrentGestureCards();
        let toPick = CardDirectory.GESTURE_LIST.filter(function(data) { return !currentGestureTypes.includes(data) });
        let gType = toPick[Math.floor(Math.random() * toPick.length)];
        return new GestureCard(gType);
    }

    newUniqueFactCard() {
        let currentFactCards = this.getCurrentFactCards();
        let toPick = CardDirectory.FACT_LIST.filter(
            function(data) { return !currentFactCards.includes(getFactCardBackgroundURL(data)) });
        let factName = toPick[Math.floor(Math.random() * toPick.length)];
        return new FactCard(getFactCardBackgroundURL(factName));
    }

    assignSearchCard(idx) {
        this.allCardDataFront[idx] = new SearchCard();
    }

    async replaceCardOpposite(cardIdx, isFront) {
        const nCardData = await this.generateRandomInfoCardData();

        // TODO prepare old card for garbage collection

        // Push new random card into data array
        if (isFront) {
            this.allCardDataBack[cardIdx] = nCardData;
        } else {
            this.allCardDataFront[cardIdx] = nCardData;
        }

        // TODO move this Update the HTML
        updateHTMLCard_AllTypes(cardIdx, !isFront, nCardData);
    }

    replaceAllWithOnly(newListOfCardsData) {
        // For all non-search cards...
        let cardIdx;
        for (cardIdx = 0; cardIdx < this.NUM_CARDS; ++cardIdx) {

            // TODO prepare old card for garbage collection
            
            // Skip if we are on the search card.
            if (cardIdx === this.searchCardIndex) {
                continue;
            }

            if (cardIdx < newListOfCardsData.length) {
                // Construct new card data.
                let nCardData = new AwardCard(newListOfCardsData[cardIdx]);
                this.allCardDataFront[cardIdx] = nCardData;
                this.allCardDataBack[cardIdx] = nCardData;

                // Update the HTML
                updateHTMLCard_AllTypes(cardIdx, true, nCardData);
                updateHTMLCard_AllTypes(cardIdx, false, nCardData);
            } else {
                // Remove card data
                this.allCardDataFront[cardIdx] = null;
                this.allCardDataBack[cardIdx] = null;

                // Update the HTML
                updateHTMLCard_AllTypes(cardIdx, true, null);
                updateHTMLCard_AllTypes(cardIdx, false, null);
            }
        }
    }
}
