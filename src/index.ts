import Module from "./wasm/zenoh-wasm.js"

interface Module {
	stringToUTF8OnStack(x: string): any,
	_zw_default_config(clocator: any): any,
	onRuntimeInitialized(): Promise<any>,
	registerJSCallback(callback: any): number,
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
// export interface IntoKeyExpr {
// 	[intoKeyExpr]: () => Promise<KeyExpr>
// }
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
			// Format :  module2.cwrap("c_func_name", return, func_args)
			_zw_open_session: module2.cwrap("zw_open_session", "number", ["number"], { async: true }),
			_zw_start_tasks: module2.cwrap("zw_start_tasks", "number", ["number"], { async: true }),
			_zw_declare_ke: module2.cwrap("zw_declare_ke", "number", ["number", "number"], { async: true }),
			_zw_put: module2.cwrap("zw_put", "number", ["number", "number", "string", "number"], { async: true }),
			_zw_sub: module2.cwrap("zw_sub", "number", ["number", "number", "number"], { async: true }),
			_test_call_js_callback: module2.cwrap("test_call_js_callback", "number", [], { async: true }),
			_register_rm_callback: module2.cwrap("register_rm_callback", "void", ["number"], { async: true })

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

// export class KeyExpr {
// 	__ptr: number
// 	[intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
// 	private constructor(ptr: number) {
// 		this.__ptr = ptr
// 	}
// 	static async new(keyexpr: string): Promise<KeyExpr> {
// 		const Zenoh: Module = await zenoh();
// 		const ckeyexpr = Zenoh.stringToUTF8OnStack(keyexpr);

// 		const ptr = Zenoh._zw_make_ke(ckeyexpr);
// 		if (ptr === 0) {
// 			throw "Failed to construct zenoh.KeyExpr"
// 		}
// 		return new KeyExpr(ptr)
// 	}
// }


// Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
// 	return KeyExpr.new(this)
// })

// Object.defineProperty(String.prototype, intoValue, function (this: string) {
// 	const encoder = new TextEncoder();
// 	const encoded = encoder.encode(this);
// 	return Promise.resolve(new Value(encoded))
// })

// Object.defineProperty(Uint8Array.prototype, intoValue, function (this: Uint8Array) {
// 	return Promise.resolve(new Value(this))
// })
// Object.defineProperty(Function.prototype, "onEvent", function (this: Function) {
// 	return this;
// })
// Object.defineProperty(Function.prototype, "onClose", function (this: Function) { })
// declare global {
// 	interface String extends IntoKeyExpr, IntoValue { }
// 	interface Uint8Array extends IntoValue { }
// }

export class Subscriber<Receiver> {
	__sub_ptr: number
	receiver: Receiver
	private constructor(sub_ptr: number, receiver: Receiver) {
		this.__sub_ptr = sub_ptr
		this.receiver = receiver
	}
}

// export interface Handler<Event, Receiver> {
// 	onEvent: (event: Event) => Promise<void>
// 	onClose?: () => Promise<void>
// 	receiver?: Receiver
// }

// TODO 
export class Sample { }
// TODO Expose: Query, Queryable, Selector 


export class Session {
	// static registry = new FinalizationRegistry((ptr: number) => (new Session(ptr)).close())
	private __ptr: number = 0
	//@ts-ignore
	private __task_ptr: number = 0
	private __zenoh: Module;

	private constructor(ptr: number, task_ptr: number, zenoh: Module) {
		this.__ptr = ptr
		this.__task_ptr = task_ptr
		this.__zenoh = zenoh

		// Session.registry.register(this, this.__ptr, this);
	}

	static async open(config: Promise<Config> | Config) {
		const cfg = await config;
		const Zenoh: Module = await zenoh();
		console.log("Zenoh object", Zenoh);
		console.log("Zenoh.api object", Zenoh.api);

		if (!cfg.check()) {
			throw "Invalid config passed: it may have been already consumed by opening another session."
		}

		const ptr = await Zenoh.api._zw_open_session(cfg.__ptr);
		console.log("Open Session ? ", ptr);

		cfg.__ptr = 0;
		if (ptr === 0) {
			throw "Failed to open zenoh.Session";
		}

		const __task_ptr = await Zenoh.api._zw_start_tasks(ptr);

		return new Session(ptr, __task_ptr, Zenoh)
	}
	async close() {
		// TODO:
		// Session.registry.unregister(this)
		throw "Unimplemented"
	}

	async put(keyexpr: number, value: string): Promise<number> {

		const ret = await this.__zenoh.api._zw_put(this.__ptr, keyexpr, value, value.length);

		if (ret < 0) {
			throw "An error occured while putting"
		}
		return ret
	}

	// Returns a pointer to the key expression in Zenoh Memory 
	async declare_ke(keyexpr: string): Promise<number> {
		console.log("JS declare_ke ", keyexpr);
		const pke = this.__zenoh.stringToUTF8OnStack(keyexpr);

		const ret = await this.__zenoh.api._zw_declare_ke(this.__ptr, pke);

		// const [Zenoh, key, val] = await Promise.all([zenoh(), keyexpr[intoKeyExpr](), value[intoValue]()]);
		// const payload = val.payload;
		// const ret = Zenoh._zw_put(this.__ptr, key, payload.byteOffset, payload.length);

		if (ret < 0) {
			throw "An error occured while Declaring Key Expr"
		}
		return ret;
	}

	async sub(keyexpr: string, callback: () => void): Promise<number> {

		const pke = await this.declare_ke(keyexpr);

		const callback_ptr: number = this.__zenoh.registerJSCallback(callback);
		const ret = await this.__zenoh.api._zw_sub(this.__ptr, pke, callback_ptr);

		if (ret < 0) {
			throw "An error occured while putting"
		}
		return ret
	}

	async do_function_callback(): Promise<number> {
		console.log("Before Call TS");
		await this.__zenoh.api._test_call_js_callback();
		console.log("After Call TS");
		return 10
	}

	async register_function_callback_do_function_callback(callback: (someArg: number) => number): Promise<number> {
		return 10
	}

	// async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: Handler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
	// async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
	// async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: Handler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {
	// 	const [Zenoh, key] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
	// 	console.log(Zenoh)
	// 	console.log(key)
	// 	if (typeof (handler) === "function") {
	// 		throw "Unimplemented"
	// 	} else {
	// 		throw "Unimplemented"
	// 	}
	// }

}