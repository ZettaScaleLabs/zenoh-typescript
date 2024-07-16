import './style.css'
import './webpage.ts'


import * as zenoh from "../../../esm"



function subscriber(ke: string, handler: (key_expr: String, value: Uint8Array) => void) {
  console.log("  SUBSCRIBER");
  console.log("  key_expr ", ke)
  console.log("  handler ", handler)
  console.log("  Calling Handler ", handler(ke, new Uint8Array([1, 2, 3])))
}

async function main() {

  const callback = function (key_expr: String, value: Uint8Array): void {
    console.log("    cb demo 1 :  Key_expr ", key_expr);
    console.log("    cb demo 1 :  Value    ", value);
  }

  const callback2 = function (key_expr: String, value: Uint8Array): void {
    console.log("    cb demo 2 :  Key_expr ", key_expr);
    console.log("    cb demo 2 :  Value    ", value);
  }

  const session = await zenoh.Session.open(zenoh.Config.new("ws/127.0.0.1:10000"));

  
  // Session put / del / get
  (await session).put(new zenoh.KeyExpr("demo/put"), new zenoh.ZBytes([65, 66, 67]));
  (await session).delete("demo/delete");

  // subscribers
  (await session).declare_subscriber("demo/1", callback);
  // (await session).declare_subscriber("demo/2", callback2);

  // publisher
  let publisher1: Publisher = await (await session).declare_publisher("demo/pub/1");
  let publisher2: Publisher = await (await session).declare_publisher("demo/pub/2");
  publisher1.put([1, 2, 3]);
  publisher1.undeclare();
  publisher1.undeclare();
  publisher2.put([65, 66, 67, 50]);

  // queryable


  // Loop to spin and keep alive
  var count = 0;
  while (true) {
    var seconds = 100;
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