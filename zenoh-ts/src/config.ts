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

  /**
   * @hidden
   */
  private constructor(locator: string) {
    this.locator = locator;
  }

  /**
   * Construct a new config, containing a locator
   * @param {string} locator - A string that respects the Locator canon form: `<proto>/<address>[?<metadata>]`
   * i.e. `ws/127.0.0.1:10000`
   * @returns {Config} configuration instance
   */

  static new(locator: string): Config {
    return new Config(locator);
  }
}
