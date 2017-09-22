// x:  top left corner x
// y:  top left corner y
// w:  bounding rect width
// h:  bounding rect height
// testX and testY: test point x and y
function isInRectBounds(x, y, w, h, testX, testY) {
    return (x < testX && testX < x + w)
        && (y < testY && testY < y + h);
}

function sq(num) {
    return num * num;
}


function distance(aX, aY, bX, bY) {
    var xDiff = bX - aX;
    var yDiff = bY - aY;
    return Math.sqrt(sq(xDiff) + sq(yDiff));
}
