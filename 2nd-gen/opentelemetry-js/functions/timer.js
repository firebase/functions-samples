exports.Timer = class {
    constructor() {
        this.start = process.hrtime.bigint();
    }

    measureMs() {
        const duration = process.hrtime.bigint() - this.start;
        return (duration / 1_000_000n).toString();
    }
};