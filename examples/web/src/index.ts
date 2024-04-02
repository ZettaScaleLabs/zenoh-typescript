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

import * as zenoh from "../../../esm"

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

async function main() {
    // Test push
    console.log("zenoh.Session.open");
    // let conn_string = "ws/192.168.21.42:10000";
    // let conn_string = "ws/192.168.1.176:10000";
    // let conn_string = "ws/192.168.1.36:10000";
    // let conn_string = "ws/192.168.1.30:10000";
    // let conn_string = "ws/192.168.1.27:10000";

    // console.log("Connecting to ",conn_string) 

    const session = await zenoh.Session.open(zenoh.Config.new("ws/127.0.0.1:10000"))

    console.log("session.declare_ke");

    // TODO: Very broken
    // const keyexpr = await zenoh.KeyExpr.new("demo/ts/rcv");

    // const keyexpr = await session.declare_ke("demo/ts/rcv");
    // const keyexpr1 = await session.declare_ke("demo/recv/from/ts");
    // const keyexpr2 = await session.declare_ke("demo/example/**");
    const keyexpr2 = await session.declare_ke("demo/send/to/ts");

    // PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB 
    // console.log("Pre Put values !");
    // executeAsync(async function () {
    //     console.log("Inside Execute Async Function !");
    //     var c = 0;
    //     while (c < 50) {
    //         let enc: TextEncoder = new TextEncoder(); // always utf-8
    //         let uint8arr: Uint8Array = enc.encode(`${c} ABCDEFG ${c}`);
    //         let value: zenoh.Value = new zenoh.Value(uint8arr);
    //         var pub_res = await session.put(keyexpr1, value);
    //         console.log("Pub ", c);

    //         await sleep(500);
    //         c++;
    //     }
    //     console.log("Finish Put Values");
    // });
    // PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB PUB 

    // SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB 
    // console.log("session.declare_subscriber");

    var sub_res = await session.declare_subscriber(keyexpr2, (keyexpr: String, value: Uint8Array) => {
        const decoder = new TextDecoder();
        // TODO: I believe that this copies the array out of WASM, 
        // out of its SharedArrayView Memory structure
        let sharedView = new Uint8Array(value)
        let text = decoder.decode(sharedView)
        console.log(">> [Subscriber] Received PUT ('" + keyexpr + "': '" + text + "')");
    });

    // 
    const keyexpr3 = await session.declare_ke("demo/send/to/ts2");


    async function example_handler(num: number): Promise<number> {
        console.log("    ASYNC TS CALLBACK: ", num);
        return 25 + num;
    }


    var sub_res = await session.declare_subscriber_handler(keyexpr3, (sample: zenoh.Sample) => {
        const decoder = new TextDecoder();

        let text = decoder.decode(sample.value.payload)
        console.log(">> [Subscriber 2] Received PUT ('" + sample.keyexpr + "': '" + text + "')");
    });



    // SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB SUB 

    // SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR 
    // console.log("session.declare_subscriber");

    // var stats = new Stats(100000);
    // const keyexpr_thr = await session.declare_ke("test/thr");

    // var sub_res = await session.declare_subscriber(keyexpr_thr, (keyexpr: String, value: Uint8Array) => {
    //     stats.increment();
    // });
    // SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR SUB_THR 

    // DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV 
    // console.log("BEGIN DEV Tests ");
    // await zenoh.DEV.call_functions_CPP_style();
    // await zenoh.DEV.call_CPP_function_with_TS_Callback();
    // console.log("END DEV Tests ");
    // DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV DEV 

    // for Sub use:
    // var enc = new TextDecoder("utf-8"); // Obviously use different 
    // let decoded_message: string = enc.decode(arr);

    // const result = await session.sub("demo/ts/test_server/", (...args: any) => {
    //     console.log("Hello, here are your args: ", args)
    // });

    // session.do_function_callback();

    // const myvar = {
    //     [intoKeyExpr]: () =>{
    //         throw "potat"
    //     }
    // }

    // console.log("Opened session")
    // const sub = await session.declare_subscriber("hi", {
    // 	async onEvent(sample) { console.log("hi") },
    // });

    // app.get("/declare", async (req, res) => {
    // 	await session.put("hi", "there");
    // 	res.send("Hello world")
    // })
    // app.listen(3000)

    // console.log("run_on_event");
    // let ret_val = await zenoh.DEV.run_on_event(function(num: number) {console.log("    TS CALLBACK received: " + num)});

    var count = 0;
    while (true) {
        var seconds = 10;
        await sleep(1000 * seconds);
        // console.log("Main Loop ? ", count)
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