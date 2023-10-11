import Module from "../zenoh-wasm/build.emscripten/zenoh-wasm"

let module: Module;

export const intoKeyExpr = Symbol("intoKeyExpr")
export interface IntoKeyExpr {
	[intoKeyExpr]: () => Promise<KeyExpr>
}
export const intoValue = Symbol("intoValue")
export interface IntoValue {
	[intoValue]: () => Promise<Value>
}

async function zenoh(): Promise<Module> {
	if (!module) {
		module = await new Module();
	}
	return module
}

/**
 * The configuration for a Zenoh Session.
 */
export class Config {
	__ptr: number = 0
	private constructor(ptr: number) {
		this.__ptr = ptr
	}
	static async new(locator: string): Promise<Config> {
		const Zenoh = await zenoh();
		const clocator = Zenoh.stringToUTF8OnStack(locator);
		const ptr = Zenoh._zw_default_config(clocator);
		if (ptr === 0) {
			throw "Failed to construct zenoh.Config";
		}
		return new Config(ptr)
	}
	check(): boolean {
		return !!this.__ptr
	}
}

export class Value {
	payload: Uint8Array
	constructor(payload: Uint8Array) {
		this.payload = payload
	}
	[intoValue](): Promise<Value> { return Promise.resolve(this) }
}

export class KeyExpr {
	__ptr: number
	[intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
	private constructor(ptr: number) {
		this.__ptr = ptr
	}
	static async new(keyexpr: string): Promise<KeyExpr> {
		const Zenoh = await zenoh();
		const ckeyexpr = Zenoh.stringToUTF8OnStack(keyexpr);
		const ptr = Zenoh._zw_make_ke(ckeyexpr);
		if (ptr === 0) {
			throw "Failed to construct zenoh.KeyExpr"
		}
		return new KeyExpr(ptr)
	}
}

Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
	return KeyExpr.new(this)
})


Object.defineProperty(String.prototype, intoValue, function (this: string) {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(this);
	return Promise.resolve(new Value(encoded))
})

export class Session {
	private __ptr: number = 0
	private constructor(ptr: number) {
		this.__ptr = ptr
	}
	static async open(config: Promise<Config> | Config) {
		const cfg = await config;
		const Zenoh = await zenoh();
		if (!cfg.check()) {
			throw "Invalid config passed: it may have been already consumed by opening another session."
		}
		const ptr = Zenoh._zw_open_session(cfg.__ptr);
		cfg.__ptr = 0;
		if (ptr === 0) {
			throw "Failed to open zenoh.Session";
		}
		return new Session(ptr)
	}
	static async put(keyexpr: IntoKeyExpr, value: IntoValue) {
		const [Zenoh, ke, val] = await Promise.all([zenoh(), keyexpr[intoKeyExpr](), value[intoValue]()])
		const payload = new Uint8Array(val.payload);
		const ret = Zenoh._zw_put(ke, payload.byteOffset, payload.length);
		if (ret < 0) {
			throw "An error occured while putting"
		}
	}
}