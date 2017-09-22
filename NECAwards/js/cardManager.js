const CARD_COLUMNS = 9;
const CARD_ROWS = 5;
const NUM_CARDS = CARD_COLUMNS * CARD_ROWS;
var allCardDataFront = [];
var allCardDataBack = [];

// =====================================================================================================================
// All getters
// =====================================================================================================================

var getCurrentAwardIds = function() {
    // TODO this takes all awards, front and back. In the future, it should only take the ones visible at the moment
    return allCardDataBack.concat(allCardDataFront)
        .filter(function(d) { return !!d && d.type === CARD_TYPE_AWARD })
        .map(function(data) { return data.awardData.award.awardId; });
};

function getCardRowCol(cardIdx) {
    return {"r": Math.floor(cardIdx / CARD_COLUMNS),
        "c": cardIdx % CARD_COLUMNS};
}

function getCurrentGestureCards() {
    return allCardDataBack.concat(allCardDataFront)
        .filter(function(d) { return !!d && d.type === CARD_TYPE_GESTURE })
        .map(function(data) { return data.gestureType; });
}

function getCurrentFactCards() {
    return allCardDataBack.concat(allCardDataFront)
        .filter(function(d) { return !!d && d.type === CARD_TYPE_FACT })
        .map(function(data) { return data.imageUrl; });
}

// =====================================================================================================================
// All Constructors
// =====================================================================================================================

const CARD_TYPE_GESTURE = "GESTURE";
const CARD_TYPE_FACT = "FACT";
const CARD_TYPE_AWARD = "AWARD";

const CHANCE_FOR_GESTURE_CARD = 0.01;
const CHANCE_FOR_FACT_CARD = 0.03;
// This is the starting point for generating a new card of all types.
// Second argument: suppliedAwardData is optional, use it only if we already have a card data to assign to an award card
// If it is not supplied, then we will call backend for a random award.
function generateRandomCardData(callback, suppliedAwardData) {
    var random = Math.random();

    var cardToMake = CARD_TYPE_AWARD;

    if (random <= CHANCE_FOR_GESTURE_CARD) {
        var currentGestureTypes = getCurrentGestureCards();
        if (currentGestureTypes.length < GESTURE_LIST.length) {
            cardToMake = CARD_TYPE_GESTURE;
        }
    } else if (CHANCE_FOR_GESTURE_CARD < random && random <= (CHANCE_FOR_GESTURE_CARD + CHANCE_FOR_FACT_CARD)) {
        var currentFactCards = getCurrentFactCards();
        if (currentFactCards.length < FACT_LIST.length) {
            cardToMake = CARD_TYPE_FACT;
        }
    } else {
        cardToMake = CARD_TYPE_AWARD;
    }

    switch (cardToMake) {
        case CARD_TYPE_GESTURE:
            callback(constructGestureCardData(currentGestureTypes));
            break;
        case CARD_TYPE_FACT:
            callback(constructFactCardData(currentFactCards));
            break;
        case CARD_TYPE_AWARD:
            if (suppliedAwardData) {
                callback(constructAwardCardData(suppliedAwardData));
            } else {
                // Post for a new random card data
                postForRandomAwards(1, getCurrentAwardIds(), function(data) {
                    console.log("new random award! " + data.response);
                    callback(constructAwardCardData(JSON.parse(data.response)[0]));
                });
            }
            break;
    }
}

const GESTURE_TYPE_GLISS = "gesture-08-gliss";
const GESTURE_TYPE_RANDOM = "gesture-03-random";
const GESTURE_TYPE_REPEAT = "gesture-06-repeat";
const GESTURE_LIST = [
    GESTURE_TYPE_GLISS,
    GESTURE_TYPE_RANDOM,
    GESTURE_TYPE_REPEAT];

function constructGestureCardData(currentGestureTypes) {
    var newCardData = {};
    newCardData.type = CARD_TYPE_GESTURE;

    var toPick = GESTURE_LIST.filter(function(data) { return !currentGestureTypes.includes(data) });
    var gType = toPick[Math.floor(Math.random() * toPick.length)];
    newCardData.gestureType = gType;
    console.log("gType = " + gType);
    newCardData.imageUrl = getGestureCardBackgroundURL(gType);
    return newCardData;
}

const FACT_LIST = [
    "fact-01", "fact-02", "fact-03", "fact-04", "fact-05",
    "fact-06", "fact-07", "fact-08", "fact-09", "fact-10",
    "fact-11", "fact-12", "fact-13", "fact-14", "fact-15",
    "fact-16", "fact-17", "fact-18", "fact-19", "fact-20"];
function constructFactCardData(currentFactCards) {
    var newCardData = {};
    newCardData.type = CARD_TYPE_FACT;

    var toPick = FACT_LIST.filter(function(data) { return !currentFactCards.includes(getFactCardBackgroundURL(data)) });
    var factName = toPick[Math.floor(Math.random() * toPick.length)];
    newCardData.imageUrl = getFactCardBackgroundURL(factName);
    console.log("factName = " + factName);
    return newCardData;
}

const OVERLAY_TIMEOUT_SECONDS = 30;
function constructAwardCardData(awardDataFromDataBase, cardIdx) {
    var newCardData = {};
    newCardData.type = CARD_TYPE_AWARD;

    newCardData.awardData = awardDataFromDataBase;
    var winnerData = newCardData.awardData.winner;
    var awardData =  newCardData.awardData.award;
    var gender;
    if (awardData.ensembleId) {
        gender = "ENSEMBLE";
    } else {
        gender = winnerData.gender;
    }
    newCardData.imageUrl = getImageForWinnerId(winnerData.ensembleId ? winnerData.ensembleId : winnerData.alumId, gender);
    newCardData.overlayTimer = new Timer(OVERLAY_TIMEOUT_SECONDS * 1000);
    return newCardData;
}
