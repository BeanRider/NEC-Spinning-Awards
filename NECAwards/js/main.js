// =====================================================================================================================
// Photo Retrieval
// =====================================================================================================================
var blankProfileM = "img/blankProfileM.png";
var blankProfileF = "img/blankProfileF.png";
var blankEnsemble = "img/blankEnsemble.png";
var allWinnerPhotos = {};
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

// =====================================================================================================================
// Mouse / Touch Input Logic
// =====================================================================================================================
// Disables pinch zoom.
// window.addEventListener('touchstart', function(e) {
//     if (e.targetTouches.length === 2) {
//         e.preventDefault();
//     }
// }, false);

function onClickGestureClick(gestureType) {
    switch (gestureType) {
        case GESTURE_TYPE_GLISS:
            playbackDragGesture(deepCopyArray(RECORDED_GESTURE_GLISS));
            break;
        case GESTURE_TYPE_RANDOM:
            playRandomGesture();
            break;
        case GESTURE_TYPE_REPEAT:
            playbackLastGesture();
            break;
    }
}

const MIN_DRAG_AMOUNT = 10;

var currentDragGesture = [];
var startTime = Date.now();


var touchDown = false;
var touchDragging = false;
function touchHandler(event) {
    var touches = event.changedTouches,
        first = touches[0];
    var mouseX = first.pageX;
    var mouseY = first.pageY;

    switch (event.type) {
        case "touchstart":
            touchDown = true;
            currentDragGesture = [];
            startTime = Date.now();
            idleActivationTimer.elapsedTime = 0;
            idleActivationTimer.longIdleTime = 0;
            break;
        case "touchmove":
            if (touchDown) {
                touchDragging = true;
            } else {
                touchDragging = false;
            }

            if (touchDragging) {
                currentDragGesture.push({
                    "t": Date.now() - startTime,
                    "pos": {"x": mouseX, "y": mouseY}});
                var selectedElement = document.elementFromPoint(mouseX, mouseY);
                if (selectedElement && currentDragGesture.length > 8) {
                    var $e = $(selectedElement);
                    animateFlip($e, mouseX, mouseY);
                }
            }
            break;
        case "touchend":
            // Only if the drag gesture was long enough
            if (currentDragGesture.length > MIN_DRAG_AMOUNT) {

                if ($lastAnimatedCard) {
                    var gLen = currentDragGesture.length;
                    var lastPoint = currentDragGesture[gLen - 1].pos;
                    var secondLastPoint = currentDragGesture[gLen - 3].pos;
                    if (lastPoint.x == secondLastPoint.x) {
                        secondLastPoint.x += 0.0001;
                    }
                    if (lastPoint.y == secondLastPoint.y) {
                        secondLastPoint.y += 0.0001;
                    }

                    var delta_x = lastPoint.x - secondLastPoint.x;
                    var delta_y = lastPoint.y - secondLastPoint.y;
                    var slope = delta_y / delta_x;

                    var angle = Math.degrees(Math.atan2(delta_y, delta_x));
                    console.log("angle %s", angle);


                    var lastRowCol = getCardRowCol(getCardIndex($lastAnimatedCard));
                    var lR = lastRowCol.r;
                    var lC = lastRowCol.c;

                    var $next1;
                    var $next2;

                    var directionString;

                    if (150 <= angle && angle < 180) {
                        $next1 = $(".r"+ lR  + " li .c" + (lC - 1) +".front");
                        $next2 = $(".r"+ lR + " li .c" + (lC - 2) +".front");
                        console.log("left");
                        directionString = "left";
                    } else if (120 <= angle && angle < 150) {
                        $next1 = $(".r"+ (lR + 1)  + " li .c" + (lC - 1) +".front");
                        $next2 = $(".r"+ (lR + 2) + " li .c" + (lC - 2) +".front");
                        console.log("bottom left");
                        directionString = "bot left";
                    } else if (60 <= angle && angle < 120) {
                        $next1 = $(".r"+ (lR + 1)  + " li .c" + lC +".front");
                        $next2 = $(".r"+ (lR + 2) + " li .c" + lC +".front");
                        console.log("bottom");
                        directionString = "bot";
                    } else if (30 <= angle && angle < 60) {
                        $next1 = $(".r"+ (lR + 1) + " li .c" + (lC + 1) +".front");
                        $next2 = $(".r"+ (lR + 2) + " li .c" + (lC + 2) +".front");
                        console.log("bottom right");
                        directionString = "bot right";
                    } else if (-30 <= angle && angle < 30) {
                        $next1 = $(".r"+ lR  + " li .c" + (lC + 1) +".front");
                        $next2 = $(".r"+ lR + " li .c" + (lC + 2) +".front");
                        console.log("right");
                        directionString = "right";
                    } else if (-60 <= angle && angle < -30) {
                        $next1 = $(".r"+ (lR - 1)  + " li .c" + (lC + 1) +".front");
                        $next2 = $(".r"+ (lR - 2) + " li .c" + (lC + 2) +".front");
                        console.log("right top");
                        directionString = "right top";
                    } else if (-120 <= angle && angle < -60) {
                        $next1 = $(".r"+ (lR - 1)  + " li .c" + lC +".front");
                        $next2 = $(".r"+ (lR - 2) + " li .c" + lC +".front");
                        console.log("top");
                        directionString = "top";
                    } else if (-150 <= angle && angle < -120) {
                        $next1 = $(".r"+ (lR - 1)  + " li .c" + (lC - 1) +".front");
                        $next2 = $(".r"+ (lR - 1) + " li .c" + (lC - 2) +".front");
                        console.log("top left");
                        directionString = "top left";
                    } else if (-180 <= angle && angle < -150) {
                        $next1 = $(".r"+ lR  + " li .c" + (lC - 1) +".front");
                        $next2 = $(".r"+ lR + " li .c" + (lC - 2) +".front");
                        console.log("left");
                        directionString = "left";
                    }

                    var extension1 = new Timer(300);
                    extension1.onDone = function () {
                        if ($next1 && $next1.offset()) {
                            var offset = $next1.offset();
                            animateFlip($next1, offset.left + 60, offset.top + 60);
                        }

                    };

                    var extension2 = new Timer(900);
                    extension2.onDone = function () {
                        if ($next2 && $next2.offset()) {
                            var offset = $next2.offset();
                            animateFlip($next2, offset.left + 60, offset.top + 60);
                        }
                    };
                    extension1.start();
                    extension2.start();
                }


                postDragGesture(currentDragGesture, function (data) {
                    console.log("after postDragGesture: " + data);
                });
                lastGesture = deepCopyArray(currentDragGesture);

                numSwipes++;
                if (numSwipes > numSwipesBeforeImprov) {

                    function stringIncludes(a, b) {
                        return a.indexOf(b) !== -1;
                    }

                    numSwipes = 0;
                    numSwipesBeforeImprov = Math.floor((Math.random() * 8) + 2);

                    var chance = Math.random();
                    transposedGesture = deepCopyArray(currentDragGesture)
                        .map(function (data) {
                            if (chance <= 0.50) {
                                if (stringIncludes(directionString, "left") || stringIncludes(directionString, "right")) {
                                    data.pos.y -= 360;
                                } else {
                                    data.pos.x -= 360;
                                }
                            } else {
                                if (stringIncludes(directionString, "left") || stringIncludes(directionString, "right")) {
                                    data.pos.y += 360;
                                } else {
                                    data.pos.x += 360;
                                }
                            }
                            return data;
                        });

                    // var chanceMirror = Math.random();
                    // var maxTime = transposedGesture[transposedGesture.length - 1].t;
                    // if (chanceMirror < 0.9) {
                    //     console.log("reverse");
                    //     transposedGesture.reverse().map(function(data) {
                    //         data.t = maxTime - data.t;
                    //     });
                    // }

                    // Improv
                    // var chanceMirror = Math.random();
                    // if (chanceMirror < 0.1) {
                    //     var toPlay = new Timer(4000);
                    //     toPlay.onDone = function () {
                    //         console.log("reach");
                    //         playbackDragGesture(transposedGesture);
                    //     };
                    // }
                    // toPlay.start();
                }
            }

            currentDragGesture = [];

            touchDown = false;
            touchDragging = false;
            break;
        default:
            return;
    }
}

function deepCopyArray(array) {
    return JSON.parse(JSON.stringify(array));
}

var numSwipes = 0;
var numSwipesBeforeImprov = 0;
var transposedGesture;


// Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};

var $lastAnimatedCard = null;

var isDragging = false;
var mouseDown = false;
$(document)
    .mousedown(function() {
        mouseDown = true;
        currentDragGesture = [];
        startTime = Date.now();
        idleActivationTimer.elapsedTime = 0;
        idleActivationTimer.longIdleTime = 0;
    })
    .mousemove(function(event) {
        if (mouseDown) {
            isDragging = true;
        } else {
            isDragging = false
        }

        if (isDragging) {
            var mouseX = event.pageX;
            var mouseY = event.pageY;
            currentDragGesture.push({
                "t": Date.now() - startTime,
                "pos": {"x": mouseX, "y": mouseY}});
            if (currentDragGesture.length > 8) {
                animateFlip(event.target, mouseX, mouseY);
            }
        }
    })
    .mouseup(function() {
        // Only if the drag gesture was long enough
        if (currentDragGesture.length > MIN_DRAG_AMOUNT) {

            if ($lastAnimatedCard) {
                var gLen = currentDragGesture.length;
                var lastPoint = currentDragGesture[gLen - 1].pos;
                var secondLastPoint = currentDragGesture[gLen - 3].pos;
                if (lastPoint.x == secondLastPoint.x) {
                    secondLastPoint.x += 0.0001;
                }
                if (lastPoint.y == secondLastPoint.y) {
                    secondLastPoint.y += 0.0001;
                }

                var delta_x = lastPoint.x - secondLastPoint.x;
                var delta_y = lastPoint.y - secondLastPoint.y;
                var slope = delta_y / delta_x;

                var angle = Math.degrees(Math.atan2(delta_y, delta_x));
                console.log("angle %s", angle);


                var lastRowCol = getCardRowCol(getCardIndex($lastAnimatedCard));
                var lR = lastRowCol.r;
                var lC = lastRowCol.c;

                var $next1;
                var $next2;

                var directionString;

                if (150 <= angle && angle < 180) {
                    $next1 = $(".r"+ lR  + " li .c" + (lC - 1) +".front");
                    $next2 = $(".r"+ lR + " li .c" + (lC - 2) +".front");
                    console.log("left");
                    directionString = "left";
                } else if (120 <= angle && angle < 150) {
                    $next1 = $(".r"+ (lR + 1)  + " li .c" + (lC - 1) +".front");
                    $next2 = $(".r"+ (lR + 2) + " li .c" + (lC - 2) +".front");
                    console.log("bottom left");
                    directionString = "bot left";
                } else if (60 <= angle && angle < 120) {
                    $next1 = $(".r"+ (lR + 1)  + " li .c" + lC +".front");
                    $next2 = $(".r"+ (lR + 2) + " li .c" + lC +".front");
                    console.log("bottom");
                    directionString = "bot";
                } else if (30 <= angle && angle < 60) {
                    $next1 = $(".r"+ (lR + 1) + " li .c" + (lC + 1) +".front");
                    $next2 = $(".r"+ (lR + 2) + " li .c" + (lC + 2) +".front");
                    console.log("bottom right");
                    directionString = "bot right";
                } else if (-30 <= angle && angle < 30) {
                    $next1 = $(".r"+ lR  + " li .c" + (lC + 1) +".front");
                    $next2 = $(".r"+ lR + " li .c" + (lC + 2) +".front");
                    console.log("right");
                    directionString = "right";
                } else if (-60 <= angle && angle < -30) {
                    $next1 = $(".r"+ (lR - 1)  + " li .c" + (lC + 1) +".front");
                    $next2 = $(".r"+ (lR - 2) + " li .c" + (lC + 2) +".front");
                    console.log("right top");
                    directionString = "right top";
                } else if (-120 <= angle && angle < -60) {
                    $next1 = $(".r"+ (lR - 1)  + " li .c" + lC +".front");
                    $next2 = $(".r"+ (lR - 2) + " li .c" + lC +".front");
                    console.log("top");
                    directionString = "top";
                } else if (-150 <= angle && angle < -120) {
                    $next1 = $(".r"+ (lR - 1)  + " li .c" + (lC - 1) +".front");
                    $next2 = $(".r"+ (lR - 1) + " li .c" + (lC - 2) +".front");
                    console.log("top left");
                    directionString = "top left";
                } else if (-180 <= angle && angle < -150) {
                    $next1 = $(".r"+ lR  + " li .c" + (lC - 1) +".front");
                    $next2 = $(".r"+ lR + " li .c" + (lC - 2) +".front");
                    console.log("left");
                    directionString = "left";
                }

                var extension1 = new Timer(300);
                extension1.onDone = function () {
                    if ($next1 && $next1.offset()) {
                        var offset = $next1.offset();
                        animateFlip($next1, offset.left + 60, offset.top + 60);
                    }

                };

                var extension2 = new Timer(900);
                extension2.onDone = function () {
                    if ($next2 && $next2.offset()) {
                        var offset = $next2.offset();
                        animateFlip($next2, offset.left + 60, offset.top + 60);
                    }
                };
                extension1.start();
                extension2.start();
            }


            postDragGesture(currentDragGesture, function (data) {
                console.log("after postDragGesture: " + data);
            });
            lastGesture = deepCopyArray(currentDragGesture);

            numSwipes++;
            if (numSwipes > numSwipesBeforeImprov) {

                function stringIncludes(a, b) {
                    return a.indexOf(b) !== -1;
                }

                numSwipes = 0;
                numSwipesBeforeImprov = Math.floor((Math.random() * 8) + 2);

                var chance = Math.random();
                transposedGesture = deepCopyArray(currentDragGesture)
                    .map(function (data) {
                    if (chance <= 0.50) {
                        if (stringIncludes(directionString, "left") || stringIncludes(directionString, "right")) {
                            data.pos.y -= 360;
                        } else {
                            data.pos.x -= 360;
                        }
                    } else {
                        if (stringIncludes(directionString, "left") || stringIncludes(directionString, "right")) {
                            data.pos.y += 360;
                        } else {
                            data.pos.x += 360;
                        }
                    }
                    return data;
                });

                // var chanceMirror = Math.random();
                // var maxTime = transposedGesture[transposedGesture.length - 1].t;
                // if (chanceMirror < 0.9) {
                //     console.log("reverse");
                //     transposedGesture.reverse().map(function(data) {
                //         data.t = maxTime - data.t;
                //     });
                // }

                // Improv
                // var toPlay = new Timer(4000);
                // toPlay.onDone = function () {
                //     console.log("reach");
                //     playbackDragGesture(transposedGesture);
                // };
                // toPlay.start();
            }
        }

        currentDragGesture = [];
        isDragging = false;
        mouseDown = false;
    });

// =====================================================================================================================
// Initialization
// =====================================================================================================================

var idleDelay = 10000;
const LONG_IDLE_TIMEOUT = 90000;
var idleActivationTimer;

var ready = false;
$(document).ready(function() {
    if (ready) {
        return;
    } else {
        ready = true;
    }

    (function initTouchHandlers() {
        document.addEventListener("touchstart", touchHandler, true);
        document.addEventListener("touchmove", touchHandler, true);
        document.addEventListener("touchend", touchHandler, true);
        document.addEventListener("touchcancel", touchHandler, true);
    })();

    (function initClickHandlers() {
        $('div.front').click(function(e) {
            console.log("clicked on front: " + e.target);
            var $card = $(e.currentTarget);

            updateHTMLCard_OnClick($card);
        });

        $('div.back').click(function(e) {
            console.log("clicked on back: " + e.target);
            var $card = $(e.currentTarget);

            updateHTMLCard_OnClick($card);
        });
    })();

    // Initializes a dictionary variable containing all winnerId to image path
    function initImages(callback) {
        getWinnerIdsWithPhotos(function(data) {
            var winnerIds = JSON.parse(data.response);
            console.log(winnerIds);

            var imageLoadCounter = winnerIds.length;
            winnerIds.forEach(function(winnerId) {

                var imagePath = "/NECAwards/img/winnerPhotosBetter/" + winnerId + "-00" + '.jpg';

                // Confirm it exists
                if (urlExists(imagePath)) {
                    allWinnerPhotos[winnerId] = imagePath;
                } else {
                    console.log(imagePath + " does not exist!");
                }

                imageLoadCounter--;
                // console.log(imageLoadCounter);
                if (imageLoadCounter <= 0) {
                    callback();
                }
            });
        });
    }

    // Initializes all card data, which is randomly generated by the backend
    function initCards() {
        postForRandomAwards(NUM_CARDS, [],
            function(data) {
                var randomCardDatas = JSON.parse(data.response);
                console.log(randomCardDatas);

                for (var cardIdx = 0 ; cardIdx < NUM_CARDS; ++cardIdx) {

                    const cardIdxConst = cardIdx;
                    generateRandomCardData(function(nCardData) {
                        // Place in the list of card data
                        allCardDataFront.push(nCardData);

                        // Update the HTML
                        updateHTMLCard_AllTypes(cardIdxConst, true, nCardData);
                    }, randomCardDatas[cardIdx]);
                }
            });
    }

    initImages(function() {
       initCards();
    });

    idleActivationTimer = new TimerLoop(1000);
    idleActivationTimer.longIdleTime = 0;
    idleActivationTimer.onEachLoop = function() {
        if (idleActivationTimer.longIdleTime > LONG_IDLE_TIMEOUT) {
            idleActivationTimer.longIdleTime = 0;
            var allI = 0;
            allCardDataFront.forEach(function(cardData) {
                var lastRowCol = getCardRowCol(allI);
                var lR = lastRowCol.r;
                var lC = lastRowCol.c;

                var $toFlip = $(".r" + lR + " li .c" + lC + ".front");
                var offset = $toFlip.offset();

                if (offset) {
                    var added = Math.random() * 70 + 230; // 70 - 300
                    animateFlip($toFlip, offset.left + added, offset.top + added);
                }
                allI++;
            });
        } else {
            idleActivationTimer.longIdleTime += 1000;
        }

        if (idleActivationTimer.elapsedTime >= idleDelay) {
            var numToPlay = Math.floor((Math.random() * 3) + 1);
            for (var i = 0 ; i < numToPlay; ++i) {
                playRandomGesture();
            }
            idleActivationTimer.elapsedTime = 0;
            idleDelay = Math.floor((Math.random() * 30) + 30) * 1000;
            console.log("setting next idle delay to: " + idleDelay);
        } else {
            idleActivationTimer.elapsedTime += 1000;
        }
    };
    idleActivationTimer.start();

});


function Timer(timeout) {
    var self = this;
    var tid = null;
    this.onDone = function() {

    };
    var onTimerDone = function() {
        self.abortTimer();
        self.onDone();
    };
    this.abortTimer = function() {
        if (tid) {
            clearInterval(tid);
            tid = null;
        }
    };
    this.start = function() {
        tid = setTimeout(onTimerDone, timeout);
    };
    this.restartTimer = function() {
        self.abortTimer();
        self.start();
    };
}

function TimerLoop(interval) {
    var self = this;
    var tid = null;
    this.elapsedTime = 0;
    this.onEachLoop = function() {

    };
    this.abortTimer = function() {
        if (tid) {
            clearInterval(tid);
            tid = null;
        }
        this.elapsedTime = 0;
    };
    this.start = function() {
        tid = setInterval(this.onEachLoop, interval);
    };
}

const RECORDED_GESTURE_GLISS = [
        {"t":0,"pos":{"x":233,"y":233}},
        {"t":200,"pos":{"x":651,"y":651}},
        {"t":400,"pos":{"x":1068,"y":1068}},
        {"t":600,"pos":{"x":1487,"y":1487}},
        {"t":800,"pos":{"x":1905,"y":1905}}];
function playRandomGesture() {
    getRandomGesture(function(data) {
        try {
            if (data.response) {
                console.log("Got random gesture: " + data.response);
                var randGesture = JSON.parse(data.response);
                playbackDragGesture(randGesture);
            } else {
                console.log("Did not get a random gesture!");
            }
        } catch(err) {
            console.log(err);
        }
    });
}

var lastGesture = [];
function playbackLastGesture() {
    playbackDragGesture(lastGesture);
}

function playbackDragGesture(gesture) {
    var timerLoop = new TimerLoop(1);
    timerLoop.onEachLoop = function() {
        var elapsedTime = timerLoop.elapsedTime;
        if (elapsedTime > 2000 || !gesture || (gesture && gesture.length === 0)) {
            timerLoop.abortTimer();
        } else {
            var item;
            var index = 0;
            while (item = gesture[index]) {
                var timeFromNowToItem = item.t - elapsedTime;
                if (timeFromNowToItem > 0) {
                    // We don't play this item, because it is in the future of the current elapsed time.
                    break;
                } else {
                    if (timeFromNowToItem > -1) {
                        gesture = gesture.splice(index + 1);
                        // This item should be played:
                        // A negative time means it was in the past. We don't want to play every single
                        // item before the current time, so we play only the ones close to the current time.
                        var selectedElement = document.elementFromPoint(item.pos.x, item.pos.y);
                        var $e = $(selectedElement);
                        if ($e && $e.offset()) {
                            animateFlip($e, $e.offset().left + 60, $e.offset().top + 60);
                        }
                        break;
                    } else {
                        gesture.splice(index, 1);
                    }
                }
                index++;
            }
        }
        timerLoop.elapsedTime += 1;
    };
    timerLoop.start();
}

function updateHTMLCard_OverlayVisible($card, show) {
    if (show) {
        $card.parent().data("activated", true);
        $card.find(".details").removeClass("hide");
        $card.find(".info-bg").css("height", "100%");
    } else {
        $card.parent().data("activated", false);
        $card.find(".details").addClass("hide");
        // $card.find(".info-bg").css("bottom", "auto");
        $card.find(".info-bg").css("height", "117px");
    }
}

// What happens when user wants to click on a card?
function updateHTMLCard_OnClick($card) {
    if ($card.parent().data("isFlipping")) {
        return;
    }

    var cardDataFront = allCardDataFront[getCardIndex($card)];
    var cardDataBack = allCardDataBack[getCardIndex($card)];

    var cardDataClicked = null;
    if ($card.hasClass("front")) {
        cardDataClicked = cardDataFront;
    } else {
        cardDataClicked = cardDataBack;
    }

    // Depending on type, do different things on click...
    var cardType = cardDataClicked.type;
    switch (cardType) {
        case CARD_TYPE_GESTURE:
            onClickGestureClick(cardDataClicked.gestureType);
            return;
        case CARD_TYPE_FACT:
        case CARD_TYPE_AWARD:
    }

    // For awards only!
    if ($card.parent().data("activated")) {
        updateHTMLCard_OverlayVisible($card, false);

        // Cancel any existing timers to prevent multiple calls
        if (cardDataFront && cardDataFront.type === CARD_TYPE_AWARD) {
            cardDataFront.overlayTimer.abortTimer();
        }
        if (cardDataBack && cardDataFront.type === CARD_TYPE_AWARD) {
            cardDataBack.overlayTimer.abortTimer();
        }
    } else {
        updateHTMLCard_OverlayVisible($card, true);

        // Cancel any existing timers to prevent multiple calls

        if (cardDataFront && cardDataFront.type === CARD_TYPE_AWARD) {
            cardDataFront.overlayTimer.onDone = function() {
                updateHTMLCard_OverlayVisible($card, false);
            };
            cardDataFront.overlayTimer.restartTimer();

        }
        if (cardDataBack && cardDataFront.type === CARD_TYPE_AWARD) {
            cardDataBack.overlayTimer.onDone = function() {
                updateHTMLCard_OverlayVisible($card, false);
            };
            cardDataBack.overlayTimer.restartTimer();
        }
    }
}

// What happens when user updates the alum details?
function updateHTMLCard_AddAlumDetails($c, alum, awardInfo, i) {
    var newDetailsDiv = $(".student-details-template").clone();
    newDetailsDiv.removeClass("student-details-template");
    newDetailsDiv.removeClass("hide");
    newDetailsDiv.addClass("student-details");
    newDetailsDiv.addClass("index-" + i);

    $($c.selector + " .details").append(newDetailsDiv);

    var $card = newDetailsDiv;

    $($card).find(".memberFirstName").text(alum.firstName ? alum.firstName : "N/A");
    $($card).find(".memberLastName").text(alum.lastName ? alum.lastName : "N/A");

    if (alum.gradYear) {
        $($card).find(".memberPosition").text(
            alum.gradYear !== "Faculty" ? "Student" : "Faculty");
    } else {
        $($card).find(".memberPosition").text("N/A");
    }

    if (alum.disciplines && alum.disciplines.length > 0) {
        var $dis = $($card).find(".memberDisciplines").text("");
        var disNum = 0;
        var disLen = alum.disciplines.length;
        alum.disciplines.forEach(function(d) {
            $dis.append(d);
            if (disNum < disLen - 1) {
                $dis.append("<br />");
            }
            disNum++;
        });
    } else {
        $($card).find(".memberDisciplines").text("N/A");
    }

    if (alum.degrees && alum.degrees.length > 0) {
        var $degrees = $($card).find(".memberDegrees").text("");
        var degreeNum = 0;
        var degreeLen = alum.degrees.length;
        alum.degrees.forEach(function(d) {
            $degrees.append(d);
            if (degreeNum < degreeLen - 1) {
                $degrees.append("<br />");
            }
            degreeNum++;
        });
    } else {
        $($card).find(".memberDegrees").text("N/A");
    }

    if (alum.gradYears && alum.gradYears.length > 0) {
        var $years = $($card).find(".memberYears").text("");
        var yearsNum = 0;
        var yearsLen = alum.gradYears.length;
        alum.gradYears.forEach(function(d) {
            $years.append(d);
            if (yearsNum < yearsLen - 1) {
                $years.append("<br />");
            }
            yearsNum++;
        });
    } else {
        $($card).find(".memberYears").text("N/A");
    }

    if (alum.studioTeachers && alum.studioTeachers.length > 0) {
        var $teachers = $($card).find(".memberTeachers").text("");
        var teachersNum = 0;
        var teachersLen = alum.studioTeachers.length;
        alum.studioTeachers.forEach(function(d) {
            $teachers.append(d.split(",").reverse().join(" "));
            if (teachersNum < teachersLen - 1) {
                $teachers.append("<br />");
            }
            teachersNum++;
        });
    } else {
        $($card).find(".memberTeachers").text("N/A");
    }
}

function updateHTMLCard_AwardText($card, awardInfo, ensembleAlums, winner) {
    // Header info
    var year = awardInfo.compDate;
    if (year) {
        $($card).find(".year").text(year);
    }
    if (awardInfo.ensembleId) {
        $($card).find(".firstName").hide();
        $($card).find(".lastName").text(winner.ensembleName);
    } else {
        $($card).find(".firstName").show();
        $($card).find(".firstName").text(winner.firstName);
        $($card).find(".lastName").text("  " + winner.lastName);
    }

    var compName = awardInfo.compName;
    if (compName) {
        $($card).find(".competitionName").text(compName);
    }

    // Competition prize info
    var compCategory = awardInfo.compCategory;
    var compPrize = awardInfo.prizeAchieved;
    var compInsti = awardInfo.compInstitution;
    var compLoc = awardInfo.compLoc;
    if (compPrize) {
        var compCategoryAndPrize = compCategory;
        if (compCategory) {
            compCategoryAndPrize += " / " + compPrize;
        }
        $($card).find(".compPrize").text(compCategoryAndPrize);
    } else {
        $($card).find(".compPrize").text("N/A")
    }
    if (compInsti) {
        $($card).find(".compInsti").text(compInsti);
    } else {
        $($card).find(".compInsti").text("N/A")
    }
    if (compLoc) {
        $($card).find(".compLoc").text(compLoc);
    } else {
        $($card).find(".compLoc").text("N/A");
    }

    // Student info
    // Clear all previous details:
    $($card.selector + " .details > .student-details").remove();

    if (ensembleAlums && ensembleAlums.length > 0) {
        ensembleAlums.forEach(function(alum, i) {
            console.log("updating alum: " + i);
            updateHTMLCard_AddAlumDetails($card, alum, awardInfo, i);
        });
    } else {
        updateHTMLCard_AddAlumDetails($card, winner, awardInfo, 0);
    }
}

const SIL_COLORS = ["#40BCD8", "#E4A860", "#EF7674", "#AE86B5"];
function randomBGColor() {
    return SIL_COLORS[Math.floor(Math.random() * SIL_COLORS.length)];
}

function updateHTMLCard_AllTypes(index, isFront, cardData) {
    var rc = getCardRowCol(index);
    var r = rc.r;
    var c = rc.c;
    console.log("r = %i, c = %i", r, c);

    var $card;
    if (isFront) {
        $card = $(".r"+ r + " li .c" + c +".front");
    } else {
        $card = $(".r"+ r + " li .c" + c +".back");
    }

    switch (cardData.type) {
        case CARD_TYPE_AWARD:
            // Award Cards
            var awardInfo = cardData.awardData.award;
            var ensembleAlums = cardData.awardData.ensembleAlums;
            var winner = cardData.awardData.winner;

            $card.find(".info-bg").show();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            updateHTMLCard_AwardText($card, awardInfo, ensembleAlums, winner);
            break;
        case CARD_TYPE_GESTURE:
            $card.find(".info-bg").hide();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            break;
        case CARD_TYPE_FACT:
            $card.find(".info-bg").hide();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            break;
    }


}

function getTransformAngle($e) {
    var t = $e.css('transform');
    if (t === "none") {
        return 0;
    } else {
        return parseInt(t.split("(")[1].split("deg")[0]);
    }
}

function getCardIndex($card) {
    var $item = $card.parent();
    var $row = $item.parent();
    var $table = $row.parent();
    var c = $row.find("li").index($item);
    var r = $table.find(".row").index($row);

    return r * CARD_COLUMNS + c;
}

// Updates the card data opposite of this
function updateHTMLCard_replaceCardOpposite(cardIdx, isFront) {
    generateRandomCardData(function(nCardData) {
        // Push new random card into data array
        if (isFront) {
            allCardDataBack[cardIdx] = nCardData;
        } else {
            allCardDataFront[cardIdx] = nCardData;
        }

        // Update the HTML
        updateHTMLCard_AllTypes(cardIdx, !isFront, nCardData);
    });
}

function animateFlip(target, x, y) {
    var $card = $(target);

    if (!$card) {
        console.log("Ignored, target is not a card!");
        return;
    }

    if (!$card.hasClass("front") && !$card.hasClass("back")) {
        console.log("Ignored, target is not a card!");
        return;
    }

    if ($card.parent().data("isFlipping")) {
        console.log("Ignored, because already in flipping state.");
        return;
    }

    if ($card.parent().data("activated")) {
        console.log("Ignored, because overlay is on.");
        return;
    }

    $lastAnimatedCard = $card;

    // Decide on how much to turn
    var xy = $card.offset();
    var centerX = xy.left + $card.width() / 2;
    var centerY = xy.top + $card.width() / 2;
    var maxWindDistance = 184;
    var distanceFromWind = distance(centerX, centerY, x, y);
    // console.log("center is at: " + centerX + ", " + centerY);
    // console.log("mouse is at: " + x + ", " + y);
    // console.log("distanceFromWind = " + distanceFromWind);
    var amountToTurn = 0;
    var durationSec = 3;
    if (distanceFromWind < maxWindDistance) {
        var distanceFromCenterPercent = distanceFromWind / maxWindDistance;
        var windPower = 1 - distanceFromCenterPercent;

        if (windPower <= 0.15) {
            amountToTurn = 1;
            durationSec = 3;
        } else if (0.15 < windPower <= 0.5) {
            amountToTurn = 3;
            durationSec = 4;
        } else if (0.5 < windPower <= 0.75) {
            amountToTurn = 5;
            durationSec = 4;
        } else  {
            amountToTurn = 7;
            durationSec = 5;
        }
        // Turn the flipping flag to true, we are going to flip it
        $card.parent().data("isFlipping", true);
    } else {
        // We won't be flipping...
        return;
    }

    // For front or back card...
    var isFront = $card.hasClass("front");

    updateHTMLCard_replaceCardOpposite(getCardIndex($card), isFront);

    // We need to turn + or -... 1 turn, 3 turns, 5 turns, or 9 turns.
    // Whether we go positive or negative is based on the current degree value.
    // 1. Get the current rotation value for other side
    var $otherCard = $card.siblings();

    // 2. Get the current rotation value for this side
    var thisAngle = getTransformAngle($card);
    var otherAngle = getTransformAngle($otherCard);

    // 3. Determine turn direction
    if (thisAngle >= 18000) {
        // Negative turn
        amountToTurn *= -1;
    } else if (thisAngle <= -18000) {
        // Positive turn, do nothing
    }

    // 4. Apply transformation
    $card.css({
        "-webkit-transition": durationSec+"s",
        "-moz-transition": durationSec+"s",
        "-ms-transition": durationSec+"s",
        "-o-transition": durationSec+"s",
        "transition": durationSec+"s",
        "transition-timing-function": "cubic-bezier(0.39, 0.41, 0.43, 1.20)"});
    $otherCard.css({
        "-webkit-transition": durationSec+"s",
        "-moz-transition": durationSec+"s",
        "-ms-transition": durationSec+"s",
        "-o-transition": durationSec+"s",
        "transition": durationSec+"s",
        "transition-timing-function": "cubic-bezier(0.39, 0.41, 0.43, 1.20"});
    if (isFront) {
        $card.css("-webkit-transform", "rotateY(" + (thisAngle + amountToTurn * 180) + "deg)");
        $otherCard.css("-webkit-transform", "rotateY(" + (thisAngle + (amountToTurn + 1) * 180) + "deg)");
    } else {
        $otherCard.css("-webkit-transform", "rotateY(" + (otherAngle + amountToTurn * 180) + "deg)");
        $card.css("-webkit-transform", "rotateY(" + (otherAngle + (amountToTurn + 1) * 180) + "deg)");
    }
    $card.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
        function(e) {
            // When transition ends:
            $card.parent().data("isFlipping", false);
        });
}
