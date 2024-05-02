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
import inspect from 'object-inspect';

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

    // Open Zenoh Session 
    const session = await zenoh.Session.open(zenoh.Config.new("ws/127.0.0.1:10000"))

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
    const keyexpr = await session.declare_ke("demo/recv/from/ts");
    const publisher : zenoh.Publisher = await session.declare_publisher(keyexpr);

    let enc: TextEncoder = new TextEncoder(); // always utf-8
    var c = 0;
    console.log("Publisher");
    while (c < 50000) {
        let currentTime = new Date().toUTCString();
        let str: string = `ABCD - ${currentTime}`;
        let uint8arr: Uint8Array = enc.encode(str);
        let value: zenoh.Value = new zenoh.Value(uint8arr);
        console.log("Publisher Put: `", str,"`");
        (publisher).put(value);
        c = c + 1;
        await sleep(1000);
    }

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