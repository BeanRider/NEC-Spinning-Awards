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

// =====================================================================================================================
// Mouse / Touch Input Logic
// =====================================================================================================================
function onClickGestureClick(gestureType) {
    switch (gestureType) {
        case CardDirectory.GESTURE_TYPE_GLISS:
            playbackDragGesture(deepCopyArray(RECORDED_GESTURE_GLISS));
            break;
        case CardDirectory.GESTURE_TYPE_RANDOM:
            playRandomGesture();
            break;
        case CardDirectory.GESTURE_TYPE_REPEAT:
            playbackLastGesture();
            break;
    }
}

const MIN_DRAG_AMOUNT = 10;

let currentDragGesture = [];
let startTime = Date.now();

let touchDown = false;
let touchDragging = false;
function touchHandler(event) {

    if (!isInitDone) {
        return;
    }

    idleActivationTimer.resetValues();

    // No drag in search mode.
    if (CARD_MANAGER.getSearchCard().isActive()) {
        return;
    }

    let touches = event.changedTouches,
        first = touches[0];
    let mouseX = first.pageX;
    let mouseY = first.pageY;

    switch (event.type) {
        case "touchstart":
            touchDown = true;
            currentDragGesture = [];
            startTime = Date.now();
            break;
        case "touchmove":

            touchDragging = touchDown;

            if (touchDragging) {
                currentDragGesture.push({
                    "t": Date.now() - startTime,
                    "pos": {"x": mouseX, "y": mouseY}});
                let selectedElement = document.elementFromAbsolutePoint(mouseX, mouseY);
                if (selectedElement && currentDragGesture.length > 8) {
                    let $e = $(selectedElement);
                    activateFlipGesture($e, mouseX, mouseY);
                }
            }
            break;
        case "touchend":
            // Only if the drag gesture was long enough
            if (currentDragGesture.length > MIN_DRAG_AMOUNT) {

                let directionString;

                if ($lastAnimatedCard) {
                    let gLen = currentDragGesture.length;
                    let lastPoint = currentDragGesture[gLen - 1].pos;
                    let secondLastPoint = currentDragGesture[gLen - 3].pos;
                    if (lastPoint.x == secondLastPoint.x) {
                        secondLastPoint.x += 0.0001;
                    }
                    if (lastPoint.y == secondLastPoint.y) {
                        secondLastPoint.y += 0.0001;
                    }

                    let delta_x = lastPoint.x - secondLastPoint.x;
                    let delta_y = lastPoint.y - secondLastPoint.y;

                    const angle = degrees(Math.atan2(delta_y, delta_x));
                    console.log("angle %s", angle);


                    const lastRowCol = CardManager.getCardRowCol(getCardIndex($lastAnimatedCard));
                    const lR = lastRowCol.r;
                    const lC = lastRowCol.c;

                    let $next1;
                    let $next2;

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

                    const extension1 = new Timer(300);
                    extension1.onDone = function () {
                        if ($next1 && $next1.offset()) {
                            const offset = $next1.offset();
                            activateFlipGesture($next1, offset.left + 60, offset.top + 60);
                        }

                    };

                    const extension2 = new Timer(900);
                    extension2.onDone = function () {
                        if ($next2 && $next2.offset()) {
                            const offset = $next2.offset();
                            activateFlipGesture($next2, offset.left + 60, offset.top + 60);
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

                    const chance = Math.random();
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

let numSwipes = 0;
let numSwipesBeforeImprov = 0;
let transposedGesture;

let $lastAnimatedCard = null;

let isDragging = false;
let mouseDown = false;
$(document)
    .mousedown(function() {
        if (!isInitDone) {
            return;
        }

        idleActivationTimer.resetValues();

        // No drag in search mode.
        if (CARD_MANAGER.getSearchCard().isActive()) {
            return;
        }
        mouseDown = true;
        currentDragGesture = [];
        startTime = Date.now();
    })
    .mousemove(function(event) {
        if (!isInitDone) {
            return;
        }

        idleActivationTimer.resetValues();

        // No drag in search mode.
        if (CARD_MANAGER.getSearchCard().isActive()) {
            return;
        }
        if (mouseDown) {
            isDragging = true;
        } else {
            isDragging = false
        }

        if (isDragging) {
            const mouseX = event.pageX;
            const mouseY = event.pageY;
            currentDragGesture.push({
                "t": Date.now() - startTime,
                "pos": {"x": mouseX, "y": mouseY}});
            if (currentDragGesture.length > 8) {
                activateFlipGesture(event.target, mouseX, mouseY);
            }
        }
    })
    .mouseup(function() {
        if (!isInitDone) {
            return;
        }

        idleActivationTimer.resetValues();

        // No drag in search mode.
        if (CARD_MANAGER.getSearchCard().isActive()) {
            return;
        }
        // Only if the drag gesture was long enough
        if (currentDragGesture.length > MIN_DRAG_AMOUNT) {
            let directionString;

            if ($lastAnimatedCard) {
                const gLen = currentDragGesture.length;
                const lastPoint = currentDragGesture[gLen - 1].pos;
                const secondLastPoint = currentDragGesture[gLen - 3].pos;
                if (lastPoint.x === secondLastPoint.x) {
                    secondLastPoint.x += 0.0001;
                }
                if (lastPoint.y === secondLastPoint.y) {
                    secondLastPoint.y += 0.0001;
                }

                const delta_x = lastPoint.x - secondLastPoint.x;
                const delta_y = lastPoint.y - secondLastPoint.y;
                const angle = degrees(Math.atan2(delta_y, delta_x));
                console.log("angle %s", angle);


                const lastRowCol = CardManager.getCardRowCol(getCardIndex($lastAnimatedCard));
                const lR = lastRowCol.r;
                const lC = lastRowCol.c;

                let $next1;
                let $next2;

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

                const extension1 = new Timer(300);
                extension1.onDone = function () {
                    if ($next1 && $next1.offset()) {
                        const offset = $next1.offset();
                        activateFlipGesture($next1, offset.left + 60, offset.top + 60);
                    }

                };

                const extension2 = new Timer(900);
                extension2.onDone = function () {
                    if ($next2 && $next2.offset()) {
                        const offset = $next2.offset();
                        activateFlipGesture($next2, offset.left + 60, offset.top + 60);
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

                const chance = Math.random();
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
let isInitDone = false;
let idleActivationTimer;

const CARD_MANAGER = new CardManager();

let $searchCardFront;
let $searchCardBack;

let ready = false;
$(document).ready(async function() {
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
        $('.SEARCH_FLOW_INACTIVE').click(() => {
            CARD_MANAGER.getSearchCard().flowPath = [1];
            updateHTMLCard_Search();
        });

        $(".closeButton").click(() => {
            CARD_MANAGER.getSearchCard().flowPath = [0];
            flipAllCards();
            updateHTMLCard_Search();
        });

        $(".SEARCH_FLOW_SEARCH_OPTIONS > div.searchBackNavButton").click(() => {
            CARD_MANAGER.getSearchCard().flowPath = [0];
            flipAllCards();
            updateHTMLCard_Search();
        });

        $(".searchOption").click(function(e) {
            // let $allOptions = $(".searchOption");
            // $allOptions.removeClass("activated");
            // $allOptions.find("i").removeClass("fa-circle");
            // $allOptions.find("i").addClass("fa-circle-o");

            let $newOption = $(e.currentTarget);
            // $newOption.addClass("activated");
            // let $activeI = $newOption.find("i");
            // $activeI.removeClass("fa-circle-o");
            // $activeI.addClass("fa-circle");

            let searchType = $newOption.find(".searchOptionText").text();
            let searchCard = CARD_MANAGER.getSearchCard();
            switch(searchType) {
                case "NAME":
                    searchCard.searchType = searchType;
                    searchCard.flowPath = [2, 3];
                    break;
                case "YEAR":
                    searchCard.searchType = searchType;
                    searchCard.flowPath = [2, 0];
                    break;
                case "DISCIPLINE":
                    searchCard.searchType = searchType;
                    searchCard.flowPath = [2, 1];
                    break;
                case "AWARD":
                    searchCard.searchType = searchType;
                    searchCard.flowPath = [2, 2];
                    break;
                default:
                    // DO NOTHING
            }
            updateHTMLCard_Search();
        });

        $(".os-only").click(function() {
            let $toggle = $(".os-only");
            let searchCard = CARD_MANAGER.getSearchCard();

            if ($toggle.hasClass("active")) {
                $toggle.find('i').toggleClass("fa-circle-o  fa-check-circle-o");
                $toggle.removeClass("active");
                searchCard.outstanding = false;
            } else {
                $toggle.find('i').toggleClass("fa-check-circle-o fa-circle-o");
                $toggle.addClass("active");
                searchCard.outstanding = true;
            }
        });

        const onKeyClick = function(e) {
            let $k = $(e.currentTarget);
            let kChar = $k.text();
            if (kChar === '⎵') {
                kChar = " ";
            }

            let $field = $(".searchField");
            let fieldText = $field.val();
            $field.val(fieldText + kChar);
        };
        $(".zRow > span").click(onKeyClick);
        $(".aRow > span").click(onKeyClick);
        $(".qRow > span").click(onKeyClick);
        $(".numberKeys > span").click(onKeyClick);

        $(".backspace").click(() => {
            let $field = $(".searchField");
            let fieldText = $field.val();
            $field.val(fieldText.substring(0, fieldText.length - 1));
        });

        $(".searchButton").click(() => {
            let body = {
                "type": CARD_MANAGER.getSearchCard().searchType,
                "keyword": $(".searchField").val(),
                "outstanding": CARD_MANAGER.getSearchCard().outstanding
            };

            postSearch(function(data) {
                try {
                    if (data.response) {
                        console.log("Got search results: " + data.response);
                        let searchResults = JSON.parse(data.response);

                        idleActivationTimer.setShortTimerEnabled(false);

                        CARD_MANAGER.replaceAllWithOnly(searchResults);
                    } else {
                        console.log("Did not get a result!");
                    }
                } catch(err) {
                    console.log(err);
                    // Set nothing on screen.
                    idleActivationTimer.setShortTimerEnabled(false);
                    CARD_MANAGER.replaceAllWithOnly([]);
                }
            }, body);
        });

        $(".SEARCH_FLOW_INPUT_YEAR > .searchBackNavButton").click(function() {
            CARD_MANAGER.getSearchCard().flowPath = [1];
            updateHTMLCard_Search()
        });

        $(".SEARCH_FLOW_INPUT_ALPHA > .searchBackNavButton").click(function() {
            CARD_MANAGER.getSearchCard().flowPath = [1];
            updateHTMLCard_Search()
        });

        $('div.front, div.back').click(function(e) {
            let $card = $(e.currentTarget);
            updateHTMLCard_OnClick($card);
        });
    })();

    // Initializes a dictionary variable containing all winnerId to image path
    async function initImages() {
        const data = await getWinnerIdsWithPhotos();
        let winnerIds = JSON.parse(data.response);

        let imageLoadCounter = winnerIds.length;
        winnerIds.forEach(function(winnerId) {

            let imagePath = "/NECAwards/img/winnerPhotosBetter/" + winnerId + "-00" + '.jpg';

            // Confirm it exists
            if (urlExists(imagePath)) {
                allWinnerPhotos[winnerId] = imagePath;
            }

            imageLoadCounter--;
            // console.log(imageLoadCounter);
            if (imageLoadCounter <= 0) {
                // return;
            }
        });
    }

    // Initializes all card data, which is randomly generated by the backend
    async function initCards() {
        const data = await postForRandomAwards(CARD_MANAGER.NUM_CARDS, []);
        await CARD_MANAGER.initCards(JSON.parse(data.response));
    }

    await initImages();
    await initCards();

    idleActivationTimer = new IdleActivationTimer();
    idleActivationTimer.start();

    isInitDone = true;
});

// =====================================================================================================================
// Gesture playback logic
// =====================================================================================================================
function flipAllCards() {
    let cardIdx = 0;
    for (cardIdx; cardIdx < CARD_MANAGER.NUM_CARDS; ++cardIdx) {
        let lastRowCol = CardManager.getCardRowCol(cardIdx);
        let lR = lastRowCol.r;
        let lC = lastRowCol.c;


        let $toFlip = $(".r" + lR + " li .c" + lC + ".front");
        if (isOdd(Math.abs(getTransformAngle($toFlip) / 180))) {
            $toFlip = $(".r" + lR + " li .c" + lC + ".back");
        }

        let offset = $toFlip.offset();

        if (offset) {
            let added = Math.random() * 70 + 230;
            activateFlipGesture($toFlip, offset.left + added, offset.top + added);
        }
    }
}

const RECORDED_GESTURE_GLISS = [
        {"t":0,"pos":{"x":233,"y":233}},
        {"t":100,"pos":{"x":651,"y":651}},
        {"t":200,"pos":{"x":1068,"y":1068}},
        {"t":300,"pos":{"x":1487,"y":1487}},
        {"t":400,"pos":{"x":1905,"y":1905}}];
function playRandomGesture() {
    getRandomGesture(function(data) {
        try {
            if (data.response) {
                console.log("Got random gesture: " + data.response);
                let randGesture = JSON.parse(data.response);
                playbackDragGesture(randGesture);
            } else {
                console.log("Did not get a random gesture!");
            }
        } catch(err) {
            console.log(err);
        }
    });
}

let lastGesture = [];
function playbackLastGesture() {
    playbackDragGesture(lastGesture);
}

function playbackDragGesture(gesture) {
    let timerLoop = new TimerLoop(1);
    timerLoop.onEachLoop = function() {
        let elapsedTime = timerLoop.elapsedTime;
        if (elapsedTime > 2000 || !gesture || (gesture && gesture.length === 0)) {
            timerLoop.abortTimer();
        } else {
            let item;
            let index = 0;
            while (item = gesture[index]) {
                let timeFromNowToItem = item.t - elapsedTime;
                if (timeFromNowToItem > 0) {
                    // We don't play this item, because it is in the future of the current elapsed time.
                    break;
                } else {
                    if (timeFromNowToItem > -1) {
                        gesture = gesture.splice(index + 1);
                        // This item should be played:
                        // A negative time means it was in the past. We don't want to play every single
                        // item before the current time, so we play only the ones close to the current time.
                        let selectedElement = document.elementFromPoint(item.pos.x, item.pos.y);
                        let $e = $(selectedElement);
                        if ($e && $e.offset()) {
                            activateFlipGesture($e, $e.offset().left + 60, $e.offset().top + 60);
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

// =====================================================================================================================
// HTML Updates
// =====================================================================================================================

function updateHTMLCard_Search() {
    let state = CARD_MANAGER.getSearchCardState();
    $searchCardFront.children().hide();

    // Reset input field
    let $field = $(".searchField");
    $field.val("");

    // Reset outstanding to false
    let $os = $(".os-only");
    $os.removeClass("active");
    $os.find('i').addClass("fa-circle-o");
    $os.find('i').removeClass("fa-check-circle-o");
    CARD_MANAGER.getSearchCard().outstanding = false;

    if (SEARCH_FLOW_INACTIVE === state) {
        $(".search").removeClass("active");
    } else {
        $(".search").addClass("active");
    }

    if (SEARCH_FLOW_INPUT_YEAR === state) {
        $searchCardFront.find("." + SEARCH_FLOW_INPUT_YEAR).show();
    } else if (SEARCH_FLOW_INPUT_ALUM === state
        || SEARCH_FLOW_INPUT_AWARD === state
        || SEARCH_FLOW_INPUT_DISCIPLINE === state) {
        $searchCardFront.find(".SEARCH_FLOW_INPUT_ALPHA").show();
    } else {
        $searchCardFront.find("." + state).show();
    }
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

    if ($card.hasClass("search")) {
        return;
    }

    if ($card.parent().data("isFlipping")) {
        return;
    }

    let cardDataFB = CARD_MANAGER.getCardDataPair(getCardIndex($card));
    let cardDataF = cardDataFB.front;
    let cardDataB = cardDataFB.back;

    let cardDataClicked = null;
    if ($card.hasClass("front")) {
        // console.log("clicked on front");
        cardDataClicked = cardDataFB.front;
    } else {
        // console.log("clicked on back");
        cardDataClicked = cardDataFB.back;
    }

    if (!cardDataClicked) {
        return;
    }

    // Depending on type, do different things on click...
    let cardType = cardDataClicked.type;
    switch (cardType) {
        case CardDirectory.CARD_TYPE_GESTURE:
            onClickGestureClick(cardDataClicked.gestureType);
            return;
        case CardDirectory.CARD_TYPE_FACT:
        case CardDirectory.CARD_TYPE_AWARD:
    }

    // For awards only!
    if ($card.parent().data("activated")) {
        updateHTMLCard_OverlayVisible($card, false);

        // Cancel any existing timers to prevent multiple calls
        if (cardDataF && cardDataF.type === CardDirectory.CARD_TYPE_AWARD) {
            cardDataF.overlayTimer.abortTimer();
        }
        if (cardDataB && cardDataB.type === CardDirectory.CARD_TYPE_AWARD) {
            cardDataB.overlayTimer.abortTimer();
        }
    } else {
        updateHTMLCard_OverlayVisible($card, true);

        // Cancel any existing timers to prevent multiple calls
        if (cardDataF && cardDataF.type === CardDirectory.CARD_TYPE_AWARD) {
            cardDataF.overlayTimer.onDone = function() {
                updateHTMLCard_OverlayVisible($card, false);
            };
            cardDataF.overlayTimer.restartTimer();
        }
        if (cardDataB && cardDataB.type === CardDirectory.CARD_TYPE_AWARD) {
            cardDataB.overlayTimer.onDone = function() {
                updateHTMLCard_OverlayVisible($card, false);
            };
            cardDataB.overlayTimer.restartTimer();
        }
    }
}

// What happens when user updates the alum details?
function updateHTMLCard_AddAlumDetails($c, alum, awardInfo, i) {
    let newDetailsDiv = $(".student-details-template").clone();
    newDetailsDiv.removeClass("student-details-template");
    newDetailsDiv.removeClass("hide");
    newDetailsDiv.addClass("student-details");
    newDetailsDiv.addClass("index-" + i);

    $($c.selector + " .details").append(newDetailsDiv);

    let $card = newDetailsDiv;

    $($card).find(".memberFirstName").text(alum.firstName ? alum.firstName : "N/A");
    $($card).find(".memberLastName").text(alum.lastName ? alum.lastName : "N/A");

    if (alum.gradYear) {
        $($card).find(".memberPosition").text(
            alum.gradYear !== "Faculty" ? "Student" : "Faculty");
    } else {
        $($card).find(".memberPosition").text("N/A");
    }

    if (alum.disciplines && alum.disciplines.length > 0) {
        let $dis = $($card).find(".memberDisciplines").text("");
        let disNum = 0;
        let disLen = alum.disciplines.length;
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
        let $degrees = $($card).find(".memberDegrees").text("");
        let degreeNum = 0;
        let degreeLen = alum.degrees.length;
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
        let $years = $($card).find(".memberYears").text("");
        let yearsNum = 0;
        let yearsLen = alum.gradYears.length;
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
        let $teachers = $($card).find(".memberTeachers").text("");
        let teachersNum = 0;
        let teachersLen = alum.studioTeachers.length;
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
    let year = awardInfo.compDate;
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

    let compName = awardInfo.compName;
    if (compName) {
        $($card).find(".competitionName").text(compName);
    }

    // Competition prize info
    let compCategory = awardInfo.compCategory;
    let compPrize = awardInfo.prizeAchieved;
    let compInsti = awardInfo.compInstitution;
    let compLoc = awardInfo.compLoc;
    if (compPrize) {
        let compCategoryAndPrize = compCategory;
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
    let rc = CardManager.getCardRowCol(index);
    let r = rc.r;
    let c = rc.c;

    let $card;
    if (isFront) {
        $card = $(".r"+ r + " li .c" + c +".front");
    } else {
        $card = $(".r"+ r + " li .c" + c +".back");
    }

    // Empty card
    if (!cardData) {
        $card.find(".info-bg").hide();
        $card.css({
            'background': 'black'
        });
        return;
    }

    switch (cardData.type) {
        case CardDirectory.CARD_TYPE_AWARD:
            // Award Cards
            let awardInfo = cardData.awardData.award;
            let ensembleAlums = cardData.awardData.ensembleAlums;
            let winner = cardData.awardData.winner;

            $card.find(".info-bg").show();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            updateHTMLCard_AwardText($card, awardInfo, ensembleAlums, winner);
            break;
        case CardDirectory.CARD_TYPE_GESTURE:
            $card.find(".info-bg").hide();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            break;
        case CardDirectory.CARD_TYPE_FACT:
            $card.find(".info-bg").hide();
            $card.css({
                'background': randomBGColor() + ' url("' + cardData.imageUrl + '")',
                'background-size': 'contain'
            });
            break;
    }
}

function getTransformAngle($e) {
    let t = $e.css('transform');
    if (t === "none") {
        return 0;
    } else {
        return parseInt(t.split("(")[1].split("deg")[0]);
    }
}

function getCardIndex($card) {
    let $item = $card.parent();
    let $row = $item.parent();
    let $table = $row.parent();
    let c = $row.find("li").index($item);
    let r = $table.find(".row").index($row);

    return r * CARD_COLUMNS + c;
}

function activateFlipGesture(target, x, y) {
    let $card = $(target);

    if (!$card) {
        return;
    }

    if (!$card.hasClass("front") && !$card.hasClass("back")) {
        // console.log("Ignored, target is not a card!");
        return;
    }

    if ($card.hasClass("search")) {
        console.log("Ignored, search card!");
        return;
    }


    if ($card.parent().data("isFlipping")) {
        // console.log("Ignored, because already in flipping state.");
        return;
    }

    if ($card.parent().data("activated")) {
        // console.log("Ignored, because overlay is on.");
        return;
    }

    $lastAnimatedCard = $card;

    // Decide on how much to turn
    const xy = $card.offset();
    const centerX = xy.left + $card.width() / 2;
    const centerY = xy.top + $card.width() / 2;
    const maxWindDistance = 184;
    const distanceFromWind = distance(centerX, centerY, x, y);
    // console.log("center is at: " + centerX + ", " + centerY);
    // console.log("mouse is at: " + x + ", " + y);
    // console.log("distanceFromWind = " + distanceFromWind);
    let amountToTurn = 0;
    let durationSec = 3;
    if (distanceFromWind < maxWindDistance) {
        const distanceFromCenterPercent = distanceFromWind / maxWindDistance;
        const windPower = 1 - distanceFromCenterPercent;

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
    const isFront = $card.hasClass("front");

    // Replace card opposite of this card
    CARD_MANAGER.replaceCardOpposite(getCardIndex($card), isFront);

    // We need to turn + or -... 1 turn, 3 turns, 5 turns, or 9 turns.
    // Whether we go positive or negative is based on the current degree value.
    // 1. Get the current rotation value for other side
    const $otherCard = $card.siblings();

    // 2. Get the current rotation value for this side
    const thisAngle = getTransformAngle($card);
    const otherAngle = getTransformAngle($otherCard);

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
