//  ██████  ██████  ███    ██ ███████ ██  ██████
// ██      ██    ██ ████   ██ ██      ██ ██
// ██      ██    ██ ██ ██  ██ █████   ██ ██   ███
// ██      ██    ██ ██  ██ ██ ██      ██ ██    ██
//  ██████  ██████  ██   ████ ██      ██  ██████

export class Config {
  /**
   * The configuration for a Zenoh Session.
   */
  locator: string;

  private constructor(locator: string) {
    this.locator = locator;
  }

  /**
   * Construct a new config, containing a locator
   * @param {string} locator - A string that respects the Locator canon form: <proto>/<address>[?<metadata>].
   * 
   * @returns {Config} configuration instance
   */

  static new(locator: string): Config {
    return new Config(locator);
  }
}
