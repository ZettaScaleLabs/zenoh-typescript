import * as zenoh from "../../../esm"

const output_area = <HTMLDivElement>document.getElementById("zenoh-output");
async function main() {

    // Test push
    const session = await zenoh.Session.open(zenoh.Config.new("ws/192.168.21.42:7447"))

    const keyexpr = await session.declare_ke("demo/ts/test");

    executeAsync(async function () {
        var c = 0;
        while (true) {
            var pub_res = await session.put(keyexpr, `Hello for WASM! [${c}]`);
            console.log("result of pub on zenoh: ", pub_res);
            await sleep(1000);
            c++;
        }
    });


    // function subcall {
    // }

    const result = await session.sub("demo/ts/test_server/", (...args: any) => {
        console.log("Hello, here are your args: ", args)
    });

    // session.do_function_callback();

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