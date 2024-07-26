
// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████  
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██ 
// █████   █████     ████       █████     ███   ██████  ██████  
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██ 
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██ 

export type IntoKeyExpr = KeyExpr | String | string;

export class KeyExpr {
    /**
     * Class to represent a Key Expression in Zenoh
     * Key Expression is Allocated and Managed by Zenoh Pico
     * this class only exists to keep track of pointer to WASM c-instance
     */
    private _inner: string
    // RemoteKeyExpr

    private constructor(key_expr: string) {
        this._inner = key_expr
    }

    toString(): string {
        return this._inner
    }

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
