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
async function main() {


    // const logger = new Logger({ name: "myLogger" });
    // logger.silly("I am a silly log.");
    // logger.trace("I am a trace log.");
    // logger.debug("I am a debug log.");
    // logger.info("I am an info log.");
    // logger.warn("I am a warn log with a json object:", { foo: "bar" });
    // logger.error("I am an error log.");
    // logger.fatal(new Error("I am a pretty Error with a stacktrace."));
    //
    // console.log(tslog)
    //


    // Test push
    console.log("main");
    console.log("Before Zenoh");
    // const session = await zenoh.Session.open(zenoh.Config.new("ws/192.168.21.42:7447"))
    const session = await zenoh.Session.open(zenoh.Config.new("ws/192.168.1.148:7447"))
    console.log("After Zenoh");
    const keyexpr = await session.declare_ke("demo/ts/test");
    console.log("TEST");

    executeAsync(async function () {
        var c = 0;

        while (true) {
            console.log("Inside While");

            let enc: TextEncoder = new TextEncoder(); // always utf-8
            let uint8arr: Uint8Array = enc.encode(`ABCD${c}`);
            let value: zenoh.Value = new zenoh.Value(uint8arr);
            console.log("Before put ");
            var pub_res = await session.put(keyexpr, value);

            console.log("result", c, " of pub on zenoh: ", pub_res);
            await sleep(1000);
            c++;
        }
    });
    console.log("After Async");

    // TODO TEST

    // for Sub use:
    // var enc = new TextDecoder("utf-8"); // Obviously use different 
    // 
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