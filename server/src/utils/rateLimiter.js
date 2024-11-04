class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
        this.waiting = [];
        this.processing = false;
    }

    async execute(fn) {
        // Clean up old requests
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);

        // Check if we're within rate limits
        if (this.requests.length >= this.maxRequests) {
            // Wait for next available slot
            await new Promise(resolve => {
                this.waiting.push(resolve);
            });
        }

        // Add current request
        this.requests.push(now);

        try {
            // Execute the function
            const result = await fn();

            // Process next waiting request if any
            this.processNext();

            return result;
        } catch (error) {
            // Ensure we process next request even if current one fails
            this.processNext();
            throw error;
        }
    }

    processNext() {
        if (this.waiting.length > 0 && !this.processing) {
            this.processing = true;
            const now = Date.now();
            
            // Clean up old requests
            this.requests = this.requests.filter(time => now - time < this.timeWindow);

            // Check if we can process next request
            if (this.requests.length < this.maxRequests) {
                const next = this.waiting.shift();
                if (next) {
                    next();
                }
            }
            this.processing = false;
        }
    }

    getStatus() {
        const now = Date.now();
        return {
            currentRequests: this.requests.filter(time => now - time < this.timeWindow).length,
            maxRequests: this.maxRequests,
            timeWindow: this.timeWindow,
            waiting: this.waiting.length
        };
    }

    clear() {
        this.requests = [];
        this.waiting = [];
        this.processing = false;
    }
}

module.exports = {
    RateLimiter
};