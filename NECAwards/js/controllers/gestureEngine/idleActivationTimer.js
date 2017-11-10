// Depends on Timer.js, cardManager.js, playRandomGesture(), main.js

class IdleTimeoutConstants {}
IdleTimeoutConstants.LONG_IDLE_TIMEOUT = 90000;
IdleTimeoutConstants.IDLE_LOOP_INTERVAL = 1000;
Object.freeze(IdleTimeoutConstants);

class IdleActivationTimer extends TimerLoop {
    constructor() {
        super(IdleTimeoutConstants.IDLE_LOOP_INTERVAL);
        this.runningShortTimer = true;
        this.shortIdleTimeout = 10000;
        this.elapsedLongIdleMS = 0;
    }

    onEachLoop() {
        if (this.elapsedLongIdleMS >= IdleTimeoutConstants.LONG_IDLE_TIMEOUT) {
            this.elapsedLongIdleMS = 0;

            // Flip all cards
            this.setShortTimerEnabled(true);
            flipAllCards();

            // Reset card to beginning
            CARD_MANAGER.getSearchCard().popAllFlowPath();
            updateHTMLCard_Search();
        } else {
            this.elapsedLongIdleMS += 1000;
        }

        if (this.runningShortTimer) {
            // Only automate flip when the search is not active.
            if (!CARD_MANAGER.getSearchCard().isActive()) {
                if (this.elapsedTime >= this.shortIdleTimeout) {
                    let numToPlay = Math.floor((Math.random() * 3) + 1);
                    for (let i = 0; i < numToPlay; ++i) {
                        playRandomGesture();
                    }
                    this.elapsedTime = 0;
                    this.shortIdleTimeout = Math.floor((Math.random() * 30) + 30) * 1000;
                    console.log("setting next idle delay to: " + this.shortIdleTimeout);
                } else {
                    this.elapsedTime += 1000;
                }
            }
        }
    };

    setShortTimerEnabled(enabled) {
        this.runningShortTimer = enabled;
        if (!enabled) {
            this.elapsedTime = 0;
        }
    }

    resetValues() {
        this.elapsedTime = 0;
        this.elapsedLongIdleMS = 0;
    }

    abortTimer() {
        super.abortTimer();
        this.resetValues();
    }
}
