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
    let xDiff = bX - aX;
    let yDiff = bY - aY;
    return Math.sqrt(sq(xDiff) + sq(yDiff));
}

// Converts from radians to degrees.
function degrees(radians) {
    return radians * 180 / Math.PI;
}

function isOdd(num) {
    return num % 2;
}

// =====

function stringIncludes(a, b) {
    return a.indexOf(b) !== -1;
}


function deepCopyArray(array) {
    return JSON.parse(JSON.stringify(array));
}
