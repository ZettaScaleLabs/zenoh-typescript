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

export function Sample_from_SampleWS(sample_ws: SampleWS) {

    let sample_kind: SampleKind;
    if (sample_ws.kind == "Delete") {
        sample_kind = SampleKind.DELETE
    } else {
        sample_kind = SampleKind.PUT
    };

    let payload = ZBytes.new(sample_ws.value);

    let key_exr = KeyExpr.new(sample_ws.key_expr);

    return Sample.new(key_exr, payload, sample_kind);
}

export function SampleWS_from_Sample(sample: Sample) : SampleWS {

    let key_expr: OwnedKeyExprWrapper = sample.keyexpr().toString();
    let value: Array<number> = Array.from(sample.payload().payload());

    let sample_kind: SampleKindWS;
    if (sample.kind() == SampleKind.DELETE) {
        sample_kind = "Delete"
    } else if (sample.kind() == SampleKind.PUT) {
        sample_kind = "Put"
    } else {
        console.log("Sample Kind not PUT | DELETE, defaulting to PUT: ", sample.kind());
        sample_kind = "Put"
    };

    let sample_ws: SampleWS = { key_expr: key_expr, value: value, kind: sample_kind };
    return sample_ws
}
