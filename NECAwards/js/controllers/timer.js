class Timer {
    constructor(timeout) {
        this.tid = null;
        this.timeout = timeout;
    }

    onTimerDone() {
        this.abortTimer();
        this.onDone();
    }

    abortTimer() {
        if (this.tid) {
            clearInterval(this.tid);
            this.tid = null;
        }
    }

    start() {
        this.tid = setTimeout(this.onTimerDone.bind(this), this.timeout);
    }

    restartTimer() {
        this.abortTimer();
        this.start();
    }

    onDone() {
        // Override this
    }
}

class TimerLoop {

    constructor(interval) {
        this.interval = interval;
        this.elapsedTime = 0;
        this.tid = null;
    }

    abortTimer() {
        if (this.tid) {
            clearInterval(this.tid);
            this.tid = null;
        }
        this.elapsedTime = 0;
    }

    start() {
        this.tid = setInterval(this.onEachLoop.bind(this), this.interval);
    }

    onEachLoop() {
        // Override this
    }
}
