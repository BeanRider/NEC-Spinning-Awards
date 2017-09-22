// Defaults to 0 to 1
function BezierInterpolator() {
    this.startValue = 0;
    this.finalValue = 1;

    this.curValue = 0;
    this.curPercentage = 0;

    this.timeVelocity = 0.002;

    this.isInterpolating = false;


    // This will reset the interpolator to its initial values and start the animation.
    this.start = function() {
        this.isInterpolating = true;
        this.curPercentage = 0;
    };

    this.reset = function() {
        this.curPercentage = 0;
    };

    this.setFinalValue = function(animateToValue) {
        this.finalValue = animateToValue;
    };

    this.doneCallack = null;
    this.setDoneCallback = function(doneCallback) {
        this.doneCallback = doneCallback;
    }
}

BezierInterpolator.prototype.bezierBlend = function(t) {
    // var p0 = 0.000;
    // var p1 = 0.060;
    // var p2 = 1.650;
    // var p3 = 1.000;

    var p0 = 0;
    var p1 = 0.2;
    var p2 = 1.29;
    var p3 = 1;

    var result =
        p0 * (1 * Math.pow(t, 0) * Math.pow((1 - t), 3))
        +
        p1 * (3 * Math.pow(t, 1) * Math.pow((1 - t), 2))
        +
        p2 * (3 * Math.pow(t, 2) * Math.pow((1 - t), 1))
        +
        p3 * (1 * Math.pow(t, 3) * Math.pow((1 - t), 0));

    return result;
};

BezierInterpolator.prototype.update = function() {
    if (this.isInterpolating) {
        this.curPercentage += this.timeVelocity;
        // reached 100% time, stop at 100%.
        if (this.curPercentage >= 1) {
            this.curPercentage = 1;

            // swap
            // var prevStartValue = this.startValue;
            // this.startValue = this.finalValue;
            // this.finalValue = prevStartValue;
            this.isInterpolating = false;
            if (this.doneCallback) {
                this.doneCallback();
            }
        }
        this.curValue = this.startValue + ((this.finalValue - this.startValue) * this.bezierBlend(this.curPercentage));
    }
};
