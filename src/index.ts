import Module from "../zenoh-wasm/build.emscripten/zenoh-wasm"

let module: Module;

export const intoKeyExpr = Symbol("intoKeyExpr")
/**
 * Something that may be turned into a Key Expression.
 * 
 * Notable default implementers:
 * - string
 */
export interface IntoKeyExpr {
	[intoKeyExpr]: () => Promise<KeyExpr>
}
export const intoValue = Symbol("intoValue")
/**
 * Something that may be turned into a Value.
 * 
 * Notable default implementers:
 * - string
 * - Uint8Array
 */
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

Object.defineProperty(Uint8Array.prototype, intoValue, function (this: Uint8Array) {
	return Promise.resolve(new Value(this))
})
Object.defineProperty(Function.prototype, "onEvent", function (this: Function) {
	return this;
})
Object.defineProperty(Function.prototype, "onClose", function (this: Function) { })
declare global {
	interface String extends IntoKeyExpr, IntoValue { }
	interface Uint8Array extends IntoValue { }
}

export class Subscriber<Receiver> {
	__ptr: number
	receiver: Receiver
}

export interface Handler<Event, Receiver> {
	onEvent: (event: Event) => Promise<void>
	onClose?: () => Promise<void>
	receiver?: Receiver
}

export class Sample { }

export class Session {
	static registry = new FinalizationRegistry((ptr: number) => (new Session(ptr)).close())
	private __ptr: number = 0
	private constructor(ptr: number) {
		this.__ptr = ptr
		Session.registry.register(this, this.__ptr, this);
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
	async close() {
		Session.registry.unregister(this)
		throw "Unimplemented"
	}
	async put(keyexpr: IntoKeyExpr, value: IntoValue) {
		const [Zenoh, key, val] = await Promise.all([zenoh(), keyexpr[intoKeyExpr](), value[intoValue]()]);
		const payload = val.payload;
		const ret = Zenoh._zw_put(this.__ptr, key, payload.byteOffset, payload.length);
		if (ret < 0) {
			throw "An error occured while putting"
		}
	}
	async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: Handler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
	async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
	async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: Handler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {
		const [Zenoh, key] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
		if (typeof (handler) === "function") {
			throw "Unimplemented"
		} else {
			throw "Unimplemented"
		}
	}
}