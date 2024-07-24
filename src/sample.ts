import { KeyExpr } from './key_expr'
import { ZBytes } from './z_bytes'

/**
 * Kinds of Samples that can be recieved from Zenoh
 */
export enum SampleKind {
    PUT = "PUT",
    DELETE = "DELETE",
}

/**
 * Samples are publication events receieved on the Socket
 */

// type IntoSample = SampleWS | [KeyExpr, ZBytes, SampleKind];
export class Sample {
    private _keyexpr: KeyExpr
    private _payload: ZBytes
    private _kind: SampleKind
    // TODO : Add Encoding

    keyexpr(): KeyExpr {
        return this._keyexpr;
    }
    payload(): ZBytes {
        return this._payload;
    }
    kind(): SampleKind {
        return this._kind;
    }
    constructor(
        keyexpr: KeyExpr,
        payload: ZBytes,
        kind: SampleKind) {
        this._keyexpr = keyexpr
        this._payload = payload
        this._kind = kind
    }

    static new(keyexpr: KeyExpr, payload: ZBytes, kind: SampleKind): Sample {
        return new Sample(keyexpr, payload, kind);
    }
}
