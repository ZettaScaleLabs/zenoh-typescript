// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██
// █████   █████     ████       █████     ███   ██████  ██████
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██

export type IntoKeyExpr = KeyExpr | String | string;

export class KeyExpr {
  /**
   * Class to represent a Key Expression in Zenoh
   */
  private _inner: string;


  private constructor(key_expr: string) {
    this._inner = key_expr;
  }

  toString(): string {
    return this._inner;
  }
  /**
   * Class to represent a Key Expression in Zenoh
   */
  static new(keyexpr: IntoKeyExpr): KeyExpr {
    if (keyexpr instanceof KeyExpr) {
      return keyexpr;
    } else if (keyexpr instanceof String) {
      return new KeyExpr(keyexpr.toString());
    } else {
      return new KeyExpr(keyexpr);
    }
  }
}
