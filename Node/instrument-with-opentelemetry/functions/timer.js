exports.Timer = class {
  /**
     *
     */
  constructor() {
    this.start = process.hrtime.bigint();
  }

  /**
     * Get the time since this timer was constructed
     * @return {string}
     */
  measureMs() {
    const duration = process.hrtime.bigint() - this.start;
    return (duration / 1000000).toString();
  }
};
