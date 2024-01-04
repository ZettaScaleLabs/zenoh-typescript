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

const output_area = <HTMLDivElement>document.getElementById("zenoh-output");
async function main() {

    // Test push
    const session = await zenoh.Session.open(zenoh.Config.new("ws/192.168.0.105:7447"))

    const keyexpr = await session.declare_ke("demo/ts/test");

    executeAsync(async function () {
        var c = 0;
        while (true) {

            var enc = new TextEncoder(); // always utf-8
            let uint8arr = enc.encode(`Hello for WASM! [${c}]`);
            let value = new zenoh.Value(uint8arr);

            var pub_res = await session.put(keyexpr, value);
            console.log("result", c, " of pub on zenoh: ", pub_res);
            await sleep(1000);
            c++;
        }
    });

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