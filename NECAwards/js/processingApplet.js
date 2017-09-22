var DIMENSION_4K_WIDTH = 3840;
var DIMENSION_4K_HEIGHT = 2160;

var DIMENSION_1080_WIDTH = 1920;
var DIMENSION_1080_HEIGHT = 1080;

var FONT_HEADER, FONT_LATO_BOLD_100, FONT_LATO_LIGHT_100, FONT_LATO_REG_100;

var CARD_ROWS = 5;
var CARD_COLUMNS = 9;
var cardGap = 49;

var cards = [];

var MORE_INFO_EXPIRE_TICK_COUNT = 1000;

var getCurrentAwardIds = function() {
    var awardIds = [];
    cards.forEach(function(card) {
        awardIds.push(card.awardData.award.awardId);
    });
    return awardIds;
};

function Card(p, x, y, size) {
    var self = this;
    this.context = p;

    this.x = x;
    this.y = y;
    this.centerX = x + size / 2;
    this.centerY = y + size / 2;
    this.size = size;
    this.color = p.color(255);

    this.interpolator = new BezierInterpolator();

    this.startRotation = 0;
    this.currentRotation = 0;
    this.goalRotation = 540;
    this.doneCallback = function() {
        this.startRotation = this.currentRotation;
    };
    this.interpolator.setDoneCallback(this.doneCallback);

    this.isFirstTimeImg = true;
    this.img1 = null;
    this.img2 = null;
    this.imageReady = false;
    this.skewtest = 0;


    this.isFirstTimeData = true;
    this.awardData = null;
    this.newAwardData = null;

    this.isExpanded = false;

    var expireTicks = 0;
    this.countDown = function() {
        if (expireTicks > 0) {
            expireTicks--;
            if (expireTicks === 0) {
                this.isExpanded = false;
            }
        }
    };

    this.startCountDown = function () {
        expireTicks = MORE_INFO_EXPIRE_TICK_COUNT;
    };


    this.flip = function(amount, vel) {
        // Update the next card if is it a new flip
        if (!this.interpolator.isInterpolating) {
            this.startRotation = this.currentRotation;
            postForRandomAwards(1, getCurrentAwardIds(), function(data) {
                // Init data
                var cardData = data[0];
                self.setAwardData(cardData);

                // Init photo
                var winner = cardData.winner;
                if (winner) {
                    // Find image
                    // var imagePath;
                    // if (winner.ensembleId) {
                    //     imagePath = winner.ensembleId + "-00";
                    // } else if (winner.alumId) {
                    //     imagePath = winner.alumId + "-00";
                    // }
                    // self.context.noLoop();
                    // self.skewtest = 0;
                    // self.imageReady = false;
                    // self.setImage(null);
                    // const cardImage = p.loadImage("/NECAwards/js/data/winnerPhotosBetter/" + imagePath + '.jpg', "jpg", function() {
                    //
                    //     self.setImage(cardImage);
                    //     self.imageReady = true;
                    //     self.context.loop();
                    // });
                    // var image = getImageForWinnerId(winner.ensembleId ? winner.ensembleId : winner.alumId);
                    // self.setImage(allWinnerPhotos[cards[0].awardData.winner.alumId]);
                    self.setImage(allWinnerPhotos["AL0181"]);
                }
            });
        }

        this.goalRotation = amount;
        this.interpolator.reset();
        this.interpolator.timeVelocity = vel * 2; // times 2 because I was using 60fps, now it is 30fps
        this.interpolator.setFinalValue(1);
        this.interpolator.start();
    };

    this.setColor = function(newColor) {
        this.color = newColor;
    };
    this.setImage = function(newImage) {
        if (this.isFirstTimeImg) {
            console.log("Setting image to img1 because: init image");
            this.img1 = newImage;
            this.isFirstTimeImg = false;
        } else {
            if ((this.currentRotation % 360) < 180) {
                console.log("Setting image to img2 because: img1 is in front");
                this.img2 = newImage;
            } else {
                console.log("Setting image to img1 because: img2 is in front");
                this.img1 = newImage;
            }
        }
    };

    var desiredImageSize = Math.round(this.size - 4);
    this.drawingBoard = this.context.createGraphics(desiredImageSize, desiredImageSize, this.context.P2D);
    this.background = null;

    this.buffer2 = p.createGraphics(desiredImageSize, this.headerHeight, p.P2D);

    this.renderedText1 = null;
    this.renderedText2 = null;
    this.update1 = true;

    this.headerHeight = 117;
    this.skewProtect = p.createGraphics(desiredImageSize, this.headerHeight, p.P2D);

}

Card.prototype.isCardFlipped = function() {
    return !(this.currentRotation % 360) < 180;
};

Card.prototype.setAwardData = function(data) {
    if (this.isFirstTimeData) {
        this.awardData = data;
        this.isFirstTimeData = false;
    } else {
        if ((this.currentRotation % 360) < 180) {
            this.newAwardData = data;
        } else {
            this.awardData = data;
        }
    }
};

Card.prototype.render = function() {

    this.interpolator.update();
    this.countDown();

    var p = this.context;
    p.noStroke();
    p.pushMatrix();

    var desiredImageSize = Math.round(this.size - 4);

    p.translate(
        this.x + this.size / 2,
        this.y + this.size / 2,
        0);

    p.fill(255);
    p.rectMode(p.CENTER);
    // p.rect(0, 0, this.size, this.size);

    var headerHeight = this.headerHeight;
    var overlayHeight;
    this.currentRotation = (this.startRotation + (this.goalRotation * this.interpolator.curValue)) % 360;
    //
    // if (this.newAwardData) {
    //     p.pushMatrix();
    //     p.rotateY(p.radians(180 + this.currentRotation));
    //
    //     // Image
    //     p.pushMatrix();
    //     p.translate(-desiredImageSize / 2, -desiredImageSize / 2, 1);
    //     if (this.img2 !== null) {
    //         if (this.img2.width !== desiredImageSize) {
    //             this.img2.resize(desiredImageSize, desiredImageSize);
    //         }
    //         p.image(this.img2, 0, 0, desiredImageSize, desiredImageSize);
    //     }
    //     p.popMatrix();
    //
    //     p.pushMatrix();
    //     overlayHeight = headerHeight;
    //     if (this.isExpanded) {
    //         overlayHeight = desiredImageSize;
    //     }
    //     // Corner origin
    //     p.translate(-desiredImageSize / 2, -desiredImageSize / 2, 2);
    //     p.translate(0, desiredImageSize - overlayHeight);
    //
    //     // Background
    //     // p.fill(0, 200);
    //     // p.noStroke();
    //     // p.rectMode(p.CORNER);
    //     // p.rect(0, 0, desiredImageSize, overlayHeight);
    //
    //     // if (this.renderedText2) {
    //     //     p.image(this.renderedText2, 51, 30);
    //     // }
    //     // renderAwardCard(p, this.newAwardData, this.isExpanded);
    //     p.popMatrix();
    //
    //     p.popMatrix();
    // }


    // Current Side:
    p.pushMatrix();
    p.rotateY(p.radians(0+this.currentRotation));

    // Image
    p.pushMatrix();
        p.translate(-desiredImageSize / 2, -desiredImageSize / 2, 1);
        if (this.img1 !== null) {

            if (!this.renderedText1) {
                var buffer = p.createGraphics(desiredImageSize, headerHeight, p.JAVA2D);
                this.renderAwardCard(buffer, this.awardData, this.isExpanded);
                // buffer.save();
                // this.renderedText1 = p.loadImage("/NECAwards/js/data/test.png");
                this.renderedText1 = buffer.get(0, 0, desiredImageSize, headerHeight);
            } else {
                // if (this.imageReady) {
                //     p.image(this.img1, 0, 0);
                // }
            }
        }
    p.popMatrix();

    // Overlay
    p.pushMatrix();
        headerHeight = 117;
        overlayHeight = headerHeight;
        if (this.isExpanded) {
            overlayHeight = desiredImageSize;
        }
        // Corner origin
        p.translate(-desiredImageSize / 2, -desiredImageSize / 2, 2);
        p.translate(0, desiredImageSize - overlayHeight);

        // Background
        // p.translate(0, 0, -2);
        // p.fill(0);
        // p.noStroke();
        // p.rectMode(p.CORNER);
        // p.rect(0, 0, desiredImageSize, overlayHeight);


    if (this.renderedText1 && this.img1 != null && this.imageReady) {
        // p.imageMode(p.CORNER);
        // p.image(this.img1, 0, -200, this.img1.width, this.img1.height);
        p.textureMode(p.IMAGE);
        p.noStroke();
        p.noFill();
        p.beginShape();
        p.texture(this.img1);

        p.vertex(0, 0, 0, 0);
        p.vertex(200, 0, 200, 0);
        p.vertex(200, 200, 200, 200);
        p.vertex(0, 200, 0, 200);


        p.endShape(p.CLOSE);
        if (this.skewtest >= 100) {
            p.translate(0, 0, 3);
            p.textureMode(p.IMAGE);
            p.beginShape();
            p.texture(this.renderedText1);
            p.vertex(0, 0, 0, 0);
            p.vertex(this.renderedText1.width, 0, this.renderedText1.width, 0);
            p.vertex(this.renderedText1.width, this.renderedText1.height, this.renderedText1.width, this.renderedText1.height);
            p.vertex(0, this.renderedText1.height, 0, this.renderedText1.height);
            p.vertex(0, 0, 0, 0);
            p.endShape();
            // p.image(this.renderedText1, 0, 0, this.renderedText1.width, this.renderedText1.height);
        } else {
            this.skewtest++;
        }
    }

    p.popMatrix();

    p.popMatrix();


    p.popMatrix();
};

Card.prototype.renderAwardCard = function(p, awardData, isExpanded) {
    p.beginDraw();
    p.background(0);
    p.noStroke();
    p.fill(100, 0, 0);
    p.rect(0, 0, p.width, p.height);
    p.fill(255);
    // p.textMode(p.SCREEN);

    // Header Left-aligned Texts
    p.pushMatrix();

    var awardWinner1 = awardData.winner;
    var awardInfo1 = awardData.award;
    var ensembleName = awardWinner1.ensembleName;
    var firstName = awardWinner1.firstName;
    var lastName = awardWinner1.lastName;
    var year = awardInfo1.compDate;
    var compName = awardInfo1.compName;
    var compPrize = awardInfo1.prizeAchieved;
    var compInsti = awardInfo1.compInstitution;
    var compLoc = awardInfo1.compLoc;
    if (!awardWinner1.ensembleName) {
        var disciplines = awardWinner1.disciplines;
        var degrees = awardWinner1.degrees;
        var gradYear = awardWinner1.gradYear;
        var gradYears = awardWinner1.gradYears;
    }
    var studioTeachers = awardWinner1.studioTeachers;

    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);

    if (year) {
        var yearTop = 45;
        var yearLeft = 9;
        p.textFont(FONT_LATO_BOLD_100, 32);
        p.text(year, yearLeft, yearTop);
    }

    if (compName) {
        var compTop = 85;
        var compLeft = 5;
        p.textFont(FONT_LATO_REG_100, 14);
        p.text(compName, compLeft, compTop);
    }
    p.popMatrix();

    // Header Right-aligned Texts
    p.pushMatrix();
    p.translate(376, -16, 16);
    p.textAlign(p.RIGHT, p.TOP);
    p.textFont(FONT_LATO_BOLD_100, 32);

    var nameRight = 9;
    var nameTop = 45;
    if (ensembleName) {
        if (p.textWidth(ensembleName) > 250) {
            var i = ensembleName.indexOf(' ');
            var splitEnsembleName = [ensembleName.slice(0,i), ensembleName.slice(i+1)];

            var textHeight = p.textDescent() + p.textAscent();
            p.text(splitEnsembleName[0], -nameRight, nameTop - textHeight - 5);
            p.text(splitEnsembleName[1], -nameRight, nameTop);
        } else {
            p.text(ensembleName, -nameRight, nameTop);
        }
    } else if (firstName && lastName) {
        if (p.textWidth(firstName + " " + lastName) > 250) {
            textHeight = p.textDescent() + p.textAscent();
            p.text(lastName, -nameRight, nameTop);
            p.textFont(FONT_LATO_LIGHT_100, 32);
            p.text(firstName, -nameRight, nameTop - textHeight - 5);
        } else {
            p.text(lastName, -nameRight, nameTop);
            p.textFont(FONT_LATO_LIGHT_100, 32);
            p.text(firstName, -nameRight - p.textWidth(lastName + " ") - 2, nameTop);
        }
    }
    p.popMatrix();

    if (isExpanded) {
        p.pushMatrix();
        p.translate(0, 107, 16);

        var leftMargin = 54;
        var prizeTop = 5;
        p.textAlign(p.LEFT, p.TOP);
        p.textFont(FONT_LATO_BOLD_100, 14);
        p.text(compPrize, leftMargin, prizeTop);

        var instiTop = 24;
        p.textFont(FONT_LATO_REG_100, 14);
        p.text(compInsti, leftMargin, instiTop);

        var locTop = 44;
        p.text(compLoc, leftMargin, locTop);

        var studentFacTop = 75;
        p.textFont(FONT_LATO_BOLD_100, 14);
        if (gradYear === "Faculty") {
            p.text("Faculty", leftMargin, studentFacTop);
        } else {
            p.text("Student", leftMargin, studentFacTop);
        }

        p.popMatrix();


        // Winner Details
        p.pushMatrix();
        var rightMargin = 15;
        p.translate(376 - rightMargin, 107, 16);
        p.textAlign(p.RIGHT, p.TOP);
        p.textFont(FONT_LATO_REG_100, 14);

        var textRowNum = 0;
        var currentMaxRow = 0;

        function setTextRow(newNum) {
            textRowNum = newNum;
            if (textRowNum > currentMaxRow) {
                currentMaxRow = textRowNum;
            }
        }

        if (disciplines && disciplines.length > 0) {
            disciplines.forEach(function (d) {
                p.text(d, 0, studentFacTop + textRowNum * 20);
                setTextRow(textRowNum + 1);
            });
        } else {
            setTextRow(textRowNum + 1);
        }

        if (gradYears && gradYears.length > 0) {
            gradYears.forEach(function (g) {
                p.text(g, 0, studentFacTop + textRowNum * 20);
                setTextRow(textRowNum + 1);
            });
        } else {
            setTextRow(textRowNum + 1);
        }

        var studioTeachersRow = textRowNum;
        if (studioTeachers && studioTeachers.length > 0) {
            studioTeachers.forEach(function (t) {
                p.text(t, 0, studentFacTop + textRowNum * 20);
                setTextRow(textRowNum + 1);
            });
        } else {
            setTextRow(textRowNum + 1);
        }

        p.popMatrix();

        p.pushMatrix();
        p.translate(leftMargin, 107, 16);
        p.textFont(FONT_LATO_BOLD_100, 14);

        p.textAlign(p.LEFT, p.TOP);
        setTextRow(disciplines ? disciplines.length : 1);
        if (degrees && degrees.length > 0) {
            degrees.forEach(function (d) {
                p.text(d, 0, studentFacTop + textRowNum * 20);
                setTextRow(textRowNum + 1);
            });
        }

        setTextRow(studioTeachersRow);
        if (studioTeachers && studioTeachers.length > 0) {
            p.textFont(FONT_LATO_BOLD_100, 14);
            p.text("Studio Teachers", 0, studentFacTop + textRowNum * 20);
        }
        p.popMatrix();

    }
    p.endDraw();
};

Card.prototype.onClick = function(x, y) {
    if (isInRectBounds(this.x, this.y, this.size, this.size, x, y)
            && !this.interpolator.isInterpolating) {
        this.isExpanded = !this.isExpanded;
    }
};

Card.prototype.onDrag = function(x, y) {
    if (this.isExpanded) {
        // TODO Scroll logic
        if (isInRectBounds(this.x, this.y, this.size, this.size, x, y)) {

        }

        // Return here so we don't flip this card.
        return;
    }

    var maxWindDistance = 230;
    var distanceFromWind = distance(this.centerX, this.centerY, x, y);
    if (distanceFromWind < maxWindDistance) {
        var distanceFromCenterPercent = distanceFromWind / maxWindDistance;
        this.color = this.context.color(255 * distanceFromCenterPercent);

        var windPower = 1 - distanceFromCenterPercent;
        console.log("windPower = " + windPower);

        if (windPower <= 0.15) {
            this.flip(180, 0.003);
        } else if (0.15 < windPower <= 0.5) {
            // this.flip(360, 0.0028);
            this.flip(540, 0.0028);
        } else if (0.5 < windPower <= 0.75) {
            // this.flip(540, 0.003);
            this.flip(900, 0.0026);
        } else  {
            // this.flip(720, 0.003);
            this.flip(1260, 0.0025);
        }
    } else {
        this.color = 255;
    }
};

var testImage, blankProfile;
var allWinnerPhotos = {};

function initImages(p, callback) {
    testImage = p.loadImage("/NECAwards/js/data/AL0181-00.jpg");
    blankProfile = p.loadImage("/NECAwards/js/data/blankProfile.jpg");

    getWinnerIdsWithPhotos(function(data) {
        console.log(data);
        var imageLoadCounter = data.length - 20; // because we are missing 20 images!
        data.forEach(function(winnerId) {
            var imagePath = winnerId + "-00";
            const image = p.loadImage(
                "/NECAwards/js/data/winnerPhotosBetter/" + imagePath + '.jpg', 'jpg', function () {

                    if (image && image.width !== -1 && image.height !== -1) {
                        allWinnerPhotos[winnerId] = image;
                    } else {
                        console.log("loaded bad image!");
                    }

                    imageLoadCounter--;
                    console.log(imageLoadCounter);
                    if (imageLoadCounter <= 0) {
                        callback();
                    }
                });
        });
    });
}

function getImageForWinnerId(winnerId) {
    if (allWinnerPhotos[winnerId]) {
        return allWinnerPhotos[winnerId];
    } else {
        return blankProfile;
    }
}

function initCards(p, w, h) {

    var cardSize = (h - cardGap * (CARD_ROWS + 1)) / CARD_ROWS;


    postForRandomAwards(
        CARD_COLUMNS * CARD_ROWS, [],
        function(data) {
            console.log(data);

            for (var r = 0; r < CARD_ROWS; ++r) {
                for (var c = 0; c < CARD_COLUMNS; ++c) {
                    const constC = c;
                    const constR = r;

                    // Create new card
                    const newCard = new Card(
                        p,
                        cardGap + constC * (cardGap + cardSize),
                        cardGap + constR * (cardGap + cardSize),
                        cardSize);

                    // Init data
                    var cardData = data[r*CARD_COLUMNS + c];
                    newCard.setAwardData(cardData);

                    // Init photo
                    var winner = cardData.winner;
                    if (winner) {
                        var image = getImageForWinnerId(winner.ensembleId ? winner.ensembleId : winner.alumId);
                        newCard.setImage(image);
                        newCard.imageReady = true;
                    }
                    cards.push(newCard);
                }
            }
        });


}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

var tickCount = 0;
var ticksBeforeReset = 120;

var dragGesture = [];
var dragValidLen = 3;
var dragPostLen = 5;
var startTime = null;

function sketchProc(processing) {
    // Default is 60 fps

    processing.draw = function() {
        processing.background(0);

        // processing.textMode(processing.MODEL);

        processing.textMode(processing.SCREEN);
        processing.ortho(-processing.width / 2, processing.width / 2, -processing.height / 2, processing.height / 2, -2000, 2000);
        processing.ambientLight(255, 255, 255, -processing.width / 2, processing.height / 2, -4000);

        for (var i in cards) {
            if (i == 0 || i == 1) {
                cards[i].render(processing);
            }
        }

        tickCount++;
        if (tickCount > ticksBeforeReset) {
            tickCount = 0;
        }
    };

    processing.mouseClicked = function() {
        for (var i in cards) {
            cards[i].onClick(processing.mouseX, processing.mouseY);
        }
    };

    processing.mousePressed = function () {
        cards.forEach(function(c) {
            c.startCountDown();
        });
    };

    processing.mouseReleased = function() {
        console.log("mouseReleased");

        if (dragGesture.length - dragValidLen > dragPostLen) {
            dragGesture.splice(0, dragValidLen);
            console.log("sending dragGesture = " + JSON.stringify(dragGesture));
            postDragGesture(dragGesture, function(data) {
                console.log("result: " + data);
            });
        }

        dragGesture = [];
        startTime = null;
    };

    processing.mouseDragged = function() {
        if (!startTime) {
            startTime = new Date().getTime() / 1000;
        }

        dragGesture.push({
            "t": new Date().getTime() / 1000 - startTime,
            "pos": {"x": processing.mouseX, "y": processing.mouseY}
        });

        if (dragGesture.length > dragValidLen) {
            for (var i in cards) {
                cards[i].onDrag(processing.mouseX, processing.mouseY);
            }
        }
    };

    processing.setup = function() {
        // processing.size(DIMENSION_1080_WIDTH, DIMENSION_1080_HEIGHT, processing.OPENGL);
        processing.size(DIMENSION_4K_WIDTH, DIMENSION_4K_HEIGHT, processing.P3D);

        processing.frameRate(30);
        processing.hint(processing.ENABLE_DEPTH_TEST);

        // FONT_HEADER = processing.loadFont("Montserrat", 200);
        FONT_LATO_BOLD_100 = processing.loadFont("Lato-Bold", 32);
        FONT_LATO_LIGHT_100 = processing.loadFont("Lato-Light", 14);
        FONT_LATO_REG_100 = processing.loadFont("Lato-Regular", 100);

        initImages(processing, function() {
            console.log("Ready");
            initCards(processing, DIMENSION_4K_WIDTH, DIMENSION_4K_HEIGHT);
        });
    };
}

var testGraphics = null;

var canvas = document.getElementById("main");

// attaching the sketchProc function to the canvas
var processingInstance = new Processing(canvas, sketchProc);
// processingInstance.externals.sketch.imageCache =
