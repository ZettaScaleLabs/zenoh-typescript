// import {dirname} from "path";
// globalThis.__dirname = dirname(import.meta.url);
// import { createRequire } from 'module';
// globalThis.require = createRequire(import.meta.url);

import Module from "./wasm/zenoh-wasm.js"

interface Module {
	stringToUTF8OnStack(x: string): any,
	_zw_default_config(clocator: any): any,
	_zw_make_ke(arg: any): any,
	_zw_open_session(arg: any): Promise<any>,
	_zw_put(ptr: any, key: any, payload_byteOffset: any, payload_length: any): any,
	_zw_sum(num1: number, num2: number): any,
	_zw_sum_int(num1: number, num2: number): any,
	onRuntimeInitialized(): Promise<any>,
	cwrap(...arg: any): any,
	api: any
}
let module2: Module;

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

export async function zenoh(): Promise<Module> {
	if (!module2) {
		module2 = await Module();
	}

	module2.onRuntimeInitialized = async () => {
		const api = {
			_zw_open_session: module2.cwrap("zw_open_session", "number", ["number"], { async: true }),
			_zw_sum: module2.cwrap("zw_sum", ["number", "number"], ["number"], { async: true }),
			_zw_sum_int: module2.cwrap("zw_sum_int", ["number", "number"], ["number"], { async: true }),
			// 
			version: module2.cwrap("version", "number", []),
			config: module2.cwrap("default_config", "number", ["string"]),
			start_tasks: module2.cwrap("start_tasks", "number", ["number"]),
			sleep: module2.cwrap("test_sleep", "", "number", { async: true }),
			declare_ke: module2.cwrap("declare_ke", "number", ["number", "string"], { async: true }),
			pub: module2.cwrap("pub", "number", ["number", "number", "string"], { async: true }),
			sub: module2.cwrap("sub", "number", ["number", "number", "number"], { async: true }),
			spin: module2.cwrap("spin", "", ["number"], { async: true }),
			close: module2.cwrap("close_session", "", ["number"], { async: true }),
			z_free: module2.cwrap("z_wasm_free", "", ["number"], { async: true })
		};
		module2.api = api;
	};
	await module2.onRuntimeInitialized()

	return module2
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
		const Zenoh: Module = await zenoh();
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
	private constructor(ptr: number, receiver: Receiver) {
		this.__ptr = ptr
		this.receiver = receiver
	}
}

export interface Handler<Event, Receiver> {
	onEvent: (event: Event) => Promise<void>
	onClose?: () => Promise<void>
	receiver?: Receiver
}

// TODO 
export class Sample { }
// TODO Expose: Query, Queryable, Selector 


export class Session {
	static registry = new FinalizationRegistry((ptr: number) => (new Session(ptr)).close())
	private __ptr: number = 0
	private constructor(ptr: number) {
		this.__ptr = ptr
		Session.registry.register(this, this.__ptr, this);
	}
	static async open(config: Promise<Config> | Config) {
		const cfg = await config;
		const Zenoh: Module = await zenoh();
		console.log("Zenoh object", Zenoh);
		console.log("Zenoh.api object", Zenoh.api);
		// console.log("Zenoh.api object", );
		// let sum = Zenoh.api.
		// 	Zenoh.api._zw_sum()
		// 	Zenoh.api.zw_sum_int()

		if (!cfg.check()) {
			throw "Invalid config passed: it may have been already consumed by opening another session."
		}

		const ptr = await Zenoh.api._zw_open_session(cfg.__ptr);
		console.log("Open Session ? ", ptr);

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
		console.log(Zenoh)
		console.log(key)
		if (typeof (handler) === "function") {
			throw "Unimplemented"
		} else {
			throw "Unimplemented"
		}
	}
}