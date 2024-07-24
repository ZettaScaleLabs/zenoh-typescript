import { KeyExpr } from './key_expr'
import { OwnedKeyExprWrapper } from './remote_api/interface/OwnedKeyExprWrapper'
import { SampleKindWS } from './remote_api/interface/SampleKindWS'
import { SampleWS } from './remote_api/interface/SampleWS'
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

// function Sample_from_SampleWS(sample: SampleWS) {

//     if (sample.kind() == SampleKind.DELETE) {
//         sample_kind = "Delete"
//     } else if (sample.kind() == SampleKind.PUT) {
//         sample_kind = "Put"
//     } else {
//         console.log("Sample Kind not PUT | DELETE, defaulting to PUT: ", sample.kind());
//         sample_kind = "Put"
//     };
// }

// function SampleWS_from_Sample(sample: SampleWS) {
//     let key_expr: OwnedKeyExprWrapper = sample.key_expr;
//     let value: Array<number> = Array.from(sample.value);
//     let sample_kind: SampleKindWS;
//     if (sample.kind() == SampleKind.DELETE) {
//         sample_kind = "Delete"
//     } else if (sample.kind() == SampleKind.PUT) {
//         sample_kind = "Put"
//     } else {
//         console.log("Sample Kind not PUT | DELETE, defaulting to PUT: ", sample.kind());
//         sample_kind = "Put"
//     };
//     let sample_ws: SampleWS = { key_expr: key_expr, value: value, kind: sample_kind };
//     let reply: ReplyWS = { result: { Ok: sample_ws } };
// }
