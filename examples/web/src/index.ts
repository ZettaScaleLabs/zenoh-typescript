//
// Copyright (c) 2023 ZettaScale Technology
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
// which is available at https://www.apache.org/licenses/LICENSE-2.0.
//
// SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
//
// Contributors:
//   ZettaScale Zenoh Team, <zenoh@zettascale.tech>
//

// import * as Zenoh from "../../../esm"
import { Option, some, none, fold } from 'fp-ts/Option';
import { SimpleChannel } from "channel-ts";

// import inspect from 'object-inspect';

// import { Logger } from "tslog";
//
// import tslog from 'tslog'
//

const output_area = <HTMLDivElement>document.getElementById("zenoh-output");

class Stats {
    round_count: number;
    round_size: number;
    finished_rounds: number;
    round_start: number;
    global_start: number | undefined;

    constructor(round_size: number) {
        this.round_count = 0;
        this.round_size = round_size;
        this.finished_rounds = 0;
        this.round_start = Date.now(),
            this.global_start = undefined;
    }

    increment() {
        if (this.round_count == 0) {
            this.round_start = Date.now();
            if (this.global_start === undefined) {
                this.global_start = this.round_start;
            }
            this.round_count += 1;
        } else if (this.round_count < this.round_size) {
            this.round_count += 1;
        } else {
            this.print_round();
            this.finished_rounds += 1;
            this.round_count = 0;
        }
    }

    print_round() {
        let elapsed = (Date.now() - this.round_start) / 1000;
        let throughtput = this.round_size / elapsed;
        console.log(throughtput + " msg/s");
    }
}


// class WrappedSocket {
//     // Clunky but its better than nothing
//     opt_ws: Option<WebSocket>;
//     on_msg_cb: (sample: string) => void;
//     // 
//     connect(url: string): void {
//         let ws = new WebSocket(url);
//         ws.onopen = this.onOpen;
//         ws.onmessage = this.onMessage;
//         ws.onerror = this.onError;
//         ws.onclose = this.onClose;
//         this.opt_ws = some(ws);
//     }

//     onOpen(event: any): void {
//         console.log(event)
//         if (this.opt_ws._tag === "None") {
//             console.log("Websocket Not intialized !");
//         } else {
//             this.opt_ws.value.send("Sub")
//         };
//     }

//     // An event listener to be called when a message is received from the server
//     onMessage(event: any): void {
//         if (this.opt_ws._tag === "Some") {
//             this.opt_ws.value.send("Sub Time baby")
//             console.log("Message from Server", event);
//             sleep(1);
//         } else {
//             console.log("Wrapped Socket not connected")
//         };
//     }
//     // An event listener to be called when an error occurs. This is a simple event named "error".
//     onError(event: any): void {
//         console.log(JSON.stringify(event.data));
//     }
//     // An event listener to be called when the WebSocket connection's readyState changes to CLOSED.
//     onClose(event: any): void {
//         console.log(JSON.stringify(event.data));
//     }
//     //
//     private constructor(on_msg_cb: (sample: string) => void) {
//         console.log("Socket is None")
//         this.opt_ws = none;
//         this.on_msg_cb = on_msg_cb

//     }

//     static new(on_msg_cb: (sample: string) => void): WrappedSocket {
//         // TODO Check format of string
//         return new WrappedSocket(on_msg_cb);
//     }
// }

enum CtrlMsgVar {
    OpenSession = "OpenSession",
    CloseSession = "CloseSession",
    UndeclareSession = "UndeclareSession",
}

class SessionMsg {
    Session: String
    constructor(input: String) {
        this.Session = input;
    }
}

class CreateKeyExpr {
    CreateKeyExpr: String
    constructor(input: String) {
        this.CreateKeyExpr = input;
    }
}

class CreateSubscriber {
    CreateSubscriber: String
    constructor(input: String) {
        this.CreateSubscriber = input;
    }
}


interface ControlInterface<T> {
    Control: T,
    to_json(input: T): string
}

// export interface DataMessage {
//     key_expr: string
//     kind: string
//     timestamp: string | null,
//     value: Array<number>
// }

// export interface DataMessage {
//     key_expr: string
//     kind: string
//     timestamp: string | null,
//     value: Array<number>
// }

class DataMessage {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Array<number>;

    constructor(key_expr: string, kind: string, timestamp: string | null, value: Array<number>) {
        this.key_expr = key_expr;
        this.kind = kind;
        this.timestamp = timestamp;
        this.value = value;
    }
}



class ControlMessage<T> implements ControlInterface<T> {
    Control: T;

    constructor(input: T) {
        this.Control = input;
    }
    to_json(): string {
        return JSON.stringify(this);
    }
}

interface Subscriber {
    [keyexpr: string]: (keyexpr: String, value: Uint8Array) => void   
}


export class Session {

    ws: WebSocket;
    ch: SimpleChannel<string>;
    session: Option<string>;
    subscribers: Subscriber
    // worker:Worker;
    // key_expr: Array<string>;
    // ch_runner: 

    // private constructor(ws: WebSocket, ch: SimpleChannel<string>, worker:Worker) {
    private constructor(ws: WebSocket, ch: SimpleChannel<string>) {
        this.ws = ws;
        this.ch = ch;
        this.session = none;
        this.subscribers = {};
    }

    async put(keyexpr: string, val: string): Promise<void> {
        let json = {
            "keyexpr": keyexpr,
            "val": val
        };

        this.ws.send(JSON.stringify(json));
    }

    async subscriber(keyexpr: string, handler: ((val: string) => Promise<void>)): Promise<void> {
        // this.subscribers
        for await (const data of this.ch) { // use async iterator to receive data
            handler(data);
        }

    }

    async send_ctrl_message<T>(ctrl_msg: ControlMessage<T>) {
        // {"Control":{"CreateKeyExpr":"/demo/test"}}
        console.log("Control Message:")
        console.log(ctrl_msg.to_json())

        this.ws.send(ctrl_msg.to_json());
    }

    // TODO TEST
    // TODO TEST
    // TODO TEST
    // TODO TEST
    // TODO TEST
    async channel_receive() {
        // use async iterator to receive data
        for await(const data of this.ch) { 
            console.log(`Data: ${data}`);
            for (const [key, func] of Object.keys(this.subscribers.keys)) {
                console.log(`${key}: ${func}`);
            }
            console.log(`Received: ${data}`);
        }
        console.log("Closed");
    }

    //
    async declare_ke(key_expr: string) {
        this.send_ctrl_message(new ControlMessage(new CreateKeyExpr(key_expr)))
    }

    async declare_subscriber(key_expr: string, handler: (keyexpr: String, value: Uint8Array) => void){
        this.subscribers[key_expr] = handler;
        this.send_ctrl_message(new ControlMessage(new CreateSubscriber(key_expr)));
    }

    static async new(config: string): Promise<Session> {
        const chan = new SimpleChannel<string>(); // creates a new simple channel

        let ws = new WebSocket(config);

        ws.onopen = function (event: any) {
            // `this` here is a websocket object
            var ctrl_msg = new ControlMessage(CtrlMsgVar.OpenSession);
            this.send(ctrl_msg.to_json());
        };

        ws.onmessage = function (event: any) {
            // `this` here is a websocket object
            let msg_from_svr = JSON.parse(event.data) as DataMessage;

            console.log(msg_from_svr)

            chan.send(event)
        };
        
        // const worker = new Worker("worker.js");
        // worker.onmessage = function(event:any) {
        //     console.log("Worker recieved message")
        // }

        while (ws.readyState != 1) {
            await sleep(1);
        }

        var session = new Session(ws, chan);
        session.channel_receive();
        return session
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function main() {

    var addr = "ws://127.0.0.1:10000"
    let session = Session.new(addr);

    const cb1 = async (msg: string) => {
        console.log('Message from SVR:', msg);
    }

    // (await session).declare_ke("demo/example/zenoh-rs-pub");
    (await session).declare_subscriber("demo/example/zenoh-rs-pub",
        async (keyexpr: String, value: Uint8Array) => {
            console.debug(">> [Subscriber] Received PUT ('" + keyexpr + "': '" + value + "')");
        }
    );

    // const seconds2 = 2;

    // await sleep(1000 * seconds2);

    // (await session).declare_subscriber("demo/example/zenoh-rs-pub");






    // (await session).subscriber("demo/test", cb1);

    // (await session).put("demo/test", "Value")

    // function on_msg_cb(msg: string) {
    //     console.log("inside on_msg_cb", msg);
    // };
    // let wrapped_socket = WrappedSocket.new(on_msg_cb);
    // wrapped_socket.connect(addr);

    // Coms channel
    // const chan = new SimpleChannel<string>(); // creates a new simple channel
    // let ws = new WebSocket(addr);
    // ws.onopen = function(event:any ){
    //     console.log("connected")
    //     this.send("Sub Message");
    // };
    // ws.onmessage = function(event:any ){
    //     console.log("msg from server", event)
    //     chan.send("data")
    // };
    // while(ws.readyState != 1){
    //     await sleep(1);
    //     console.log(ws.readyState);
    // }

    // let rcv_msg = chan.receive()
    // console.log("chan ",chan)
    // console.log("rcv_msg ",rcv_msg)


    ////////////////////////
    // Open Zenoh Session 
    // const session = await zenoh.Session.open(zenoh.Config.new("ws/127.0.0.1:10000"))

    // Put Directly on session
    // const keyexpr1 = await session.declare_ke("demo/recv/from/ts");
    // (async () => {
    //     console.log("Inside Execute Async Function !");
    //     var c = 0;
    //     while (c < 50) {
    //         let enc: TextEncoder = new TextEncoder(); // always utf-8
    //         let uint8arr: Uint8Array = enc.encode(`${c} ABCDEFG ${c}`);
    //         let value: zenoh.Value = new zenoh.Value(uint8arr);
    //         var put_res = await session.put(keyexpr1, value);
    //         console.log("Put ", c);
    //         await sleep(500);
    //         c++;
    //     }
    //     console.log("Finish Put Values");
    // })();

    // Subscriber
    // const key_expr_2: zenoh.KeyExpr = await session.declare_ke("demo/send/to/ts");
    // var sub = await session.declare_subscriber_handler_async(key_expr_2,
    //     async (sample: zenoh.Sample) => {
    //         const decoder = new TextDecoder();
    //         let text = decoder.decode(sample.value.payload)
    //         // console.log("DEBUG Sample", inspect(sample.keyexpr.toString()));
    //         console.debug(">> [Subscriber 2] Received PUT ('" + sample.keyexpr.__ptr + "': '" + text + "')");
    //     }
    // );


    // Publisher
    // const keyexpr = await session.declare_ke("demo/recv/from/ts");
    // const publisher : zenoh.Publisher = await session.declare_publisher(keyexpr);

    // let enc: TextEncoder = new TextEncoder(); // always utf-8
    // var c = 0;
    // console.log("Publisher");
    // while (c < 50000) {
    //     let currentTime = new Date().toUTCString();
    //     let str: string = `ABCD - ${currentTime}`;
    //     let uint8arr: Uint8Array = enc.encode(str);
    //     let value: zenoh.Value = new zenoh.Value(uint8arr);
    //     console.log("Publisher Put: `", str,"`");
    //     (publisher).put(value);
    //     c = c + 1;
    //     await sleep(1000);
    // }

    // Loop to spin and keep alive
    var count = 0;
    while (true) {
        var seconds = 10;
        await sleep(1000 * seconds);
        console.log("Main Loop ? ", count)
        count = count + 1;
    }
}

main().then(() => console.log("Done")).catch(e => {
    console.log(e)
    throw e
})

function executeAsync(func: any) {
    setTimeout(func, 0);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}