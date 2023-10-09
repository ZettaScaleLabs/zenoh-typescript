// @ts-ignore
import * as zenohWasm from "../zenoh-wasm/build.emscripten/zenoh-wasm"

export class Config {
	inner: number = 0
	constructor(locator: string) {
		const clocator = zenohWasm.stringToUTF8OnStack(locator);
		this.inner = zenohWasm._zw_default_config(clocator);
		if (this.inner === 0) {
			throw "Failed to construct zenoh.Config";
		}
	}
	check(): boolean {
		return !!this.inner
	}
}

export const intoKeyExpr = Symbol("intoKeyExpr")
export interface IntoKeyExpr {
	[intoKeyExpr]: () => KeyExpr
}
export const intoValue = Symbol("intoValue")
export interface IntoValue {
	[intoValue]: () => Value
}

export class Value {
	payload: Uint8Array
	constructor(payload: Uint8Array) {
		this.payload = payload
	}
	[intoValue](): Value { return this }
}

export class KeyExpr {
	inner: number
	[intoKeyExpr](): KeyExpr { return this }
	constructor(keyexpr: string | number) {
		if (typeof keyexpr === "number") {
			this.inner = keyexpr;
			return;
		}
		const ckeyexpr = zenohWasm.stringToUTF8OnStack(keyexpr);
		this.inner = zenohWasm._zw_make_ke(ckeyexpr);
		if (this.inner === 0) {
			throw "Failed to construct zenoh.KeyExpr"
		}
	}
	static fromPtr(ptr: number): KeyExpr {
		return new KeyExpr(ptr)
	}
}

Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
	return new KeyExpr(this)
})


Object.defineProperty(String.prototype, intoValue, function (this: string) {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(this);
	return new Value(encoded)
})

export class Session {
	inner: number = 0
	constructor(config: Config) {
		if (!config.check()) {
			throw "Invalid config passed: it may have been already consumed by opening another session."
		}
		this.inner = zenohWasm._zw_open_session(config.inner);
		config.inner = 0;
		if (this.inner === 0) {
			throw "Failed to open zenoh.Session";
		}
	}
	put(keyexpr: IntoKeyExpr, value: IntoValue) {
		const ke = keyexpr[intoKeyExpr]();
		const val = value[intoValue]();
		const payload = new Uint8Array(val.payload);
		const ret = zenohWasm._zw_put(ke, payload.byteOffset, payload.length);
		if (ret < 0) {
			throw "An error occured while putting"
		}
	}
}