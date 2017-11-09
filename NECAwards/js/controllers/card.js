'use strict';
// Contains all possible constant card types
class CardDirectory {}
CardDirectory.CARD_TYPE_GESTURE = "GESTURE";
CardDirectory.CARD_TYPE_FACT = "FACT";
CardDirectory.CARD_TYPE_AWARD = "AWARD";
CardDirectory.CARD_TYPE_SEARCH = "SEARCH";
CardDirectory.FACT_LIST = [
    "fact-01", "fact-02", "fact-03", "fact-04", "fact-05",
    "fact-06", "fact-07", "fact-08", "fact-09", "fact-10",
    "fact-11", "fact-12", "fact-13", "fact-14", "fact-15",
    "fact-16", "fact-17", "fact-18", "fact-19", "fact-20"];
CardDirectory.GESTURE_TYPE_GLISS = "gesture-08-gliss";
CardDirectory.GESTURE_TYPE_RANDOM = "gesture-03-random";
CardDirectory.GESTURE_TYPE_REPEAT = "gesture-06-repeat";
CardDirectory.GESTURE_LIST = [
    CardDirectory.GESTURE_TYPE_GLISS,
    CardDirectory.GESTURE_TYPE_RANDOM,
    CardDirectory.GESTURE_TYPE_REPEAT];

Object.freeze(CardDirectory);

class Card {
    constructor(cardType) {
        this.type = cardType;
    }
}

const OVERLAY_TIMEOUT_SECONDS = 30;
class AwardCard extends Card {
    constructor(awardData) {
        super(CardDirectory.CARD_TYPE_AWARD);
        this.awardData = awardData;
        let winnerInfo = this.awardData.winner;
        let awardInfo =  this.awardData.award;
        let gender;
        if (awardInfo.ensembleId) {
            gender = "ENSEMBLE";
        } else {
            gender = winnerInfo.gender;
        }
        this.imageUrl = getImageForWinnerId(winnerInfo.ensembleId ? winnerInfo.ensembleId : winnerInfo.alumId, gender);
        this.overlayTimer = new Timer(OVERLAY_TIMEOUT_SECONDS * 1000);
    }
}

class GestureCard extends Card {
    constructor(gType) {
        super(CardDirectory.CARD_TYPE_GESTURE);
        this.gestureType = gType;
        this.imageUrl = getGestureCardBackgroundURL(gType);
    }
}

class FactCard extends Card {
    constructor(imageUrl) {
        super(CardDirectory.CARD_TYPE_FACT);
        this.imageUrl = imageUrl;
    }
}

const SEARCH_FLOW_INACTIVE = "SEARCH_FLOW_INACTIVE";
const SEARCH_FLOW_SEARCH_OPTIONS = "SEARCH_FLOW_SEARCH_OPTIONS";
const SEARCH_FLOW_INPUT_YEAR = "SEARCH_FLOW_INPUT_YEAR";
const SEARCH_FLOW_INPUT_DISCIPLINE = "SEARCH_FLOW_INPUT_DISCIPLINE";
const SEARCH_FLOW_INPUT_AWARD = "SEARCH_FLOW_INPUT_AWARD";
const SEARCH_FLOW_INPUT_ALUM = "SEARCH_FLOW_INPUT_ALUM";
const SEARCH_FLOW_RESULT_PAGES = "SEARCH_FLOW_RESULT_PAGES";
const SEARCH_CARD_FLOW = [
    SEARCH_FLOW_INACTIVE,
    SEARCH_FLOW_SEARCH_OPTIONS,
    [SEARCH_FLOW_INPUT_YEAR, SEARCH_FLOW_INPUT_DISCIPLINE, SEARCH_FLOW_INPUT_AWARD, SEARCH_FLOW_INPUT_ALUM],
    SEARCH_FLOW_RESULT_PAGES];
class SearchCard extends Card {
    constructor() {
        super(CardDirectory.CARD_TYPE_SEARCH);
        // Flow state is the path to the current flow state. For example:
        // [0] == SEARCH_FLOW_INACTIVE
        // [2, 1] == SEARCH_FLOW_INPUT_DISCIPLINE
        // [2, 2] == SEARCH_FLOW_INPUT_AWARD
        // [] or [-1] or [100] == error
        this.flowPath = [0];
        this.searchType = "NAME";
        this.outstanding = false;
        this.pages = 0;
        this.pageIdx = 0;
    }

    isActive() {
        if (this.flowPath.length >= 1) {
            return this.flowPath[0] !== 0;
        }
        return false;
    }

    // Returns the current search flow state.
    getSearchState() {
        let currentFlowState = SEARCH_CARD_FLOW;
        this.flowPath.forEach(function(branchIdx) {
            if (branchIdx >= currentFlowState.length) {
                throw "Invalid flow path led to index out of bounds!";
            } else{
                currentFlowState = currentFlowState[branchIdx];
            }
        });
        if (Array.isArray(currentFlowState)) {
            throw "Invalid flow path led to an array result, when it should be an element."
        }
        return currentFlowState;
    }
}
