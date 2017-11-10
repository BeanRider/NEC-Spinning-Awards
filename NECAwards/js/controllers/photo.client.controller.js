// =====================================================================================================================
// Photo Retrieval
// =====================================================================================================================
const blankProfileM = "img/blankProfileM.png";
const blankProfileF = "img/blankProfileF.png";
const blankEnsemble = "img/blankEnsemble.png";
const allWinnerPhotos = {};

function getImageForWinnerId(winnerId, gender) {
    if (allWinnerPhotos[winnerId]) {
        return allWinnerPhotos[winnerId];
    } else {
        switch (gender) {
            case "ENSEMBLE":
                return blankEnsemble;
            case "M":
                return blankProfileM;
            case "F":
                return blankProfileF;
        }
    }
}

function getGestureCardBackgroundURL(gestureType) {
    return "img/gestureBG/" + gestureType + ".jpg";
}

function getFactCardBackgroundURL(factType) {
    return "img/factBG/" + factType + ".jpg";
}
