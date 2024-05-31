import './style.css'
import './webpage.ts'

import { subscriber2} from './remote_api.ts'
import adze from 'adze';
import { RemoteSession, SubClass } from './remote_api.ts'
import { main_ch } from './experiments.ts'


function subscriber(ke: string, handler: (key_expr: String, value: Uint8Array) => void) {
  console.log("  SUBSCRIBER");
  console.log("  key_expr ", ke)
  console.log("  handler ", handler)
  console.log("  Calling Handler ", handler(ke, new Uint8Array([1, 2, 3])))
}


async function main() {


  const callback = function (key_expr: String, value: Uint8Array): void {
    console.log("    Insider Callback");
    console.log("    Insider Callback Key_expr ", key_expr);
    console.log("    Insider Callback Value    ", value);
  }

  // main_ch();

  // console.log("Calling Function");
  // subscriber("demo/1",callback)
  // console.log("===========================");
  // subscriber2("demo/1",callback)

  //////////////////////////////////////////////////////////////////////////////
  var addr = "ws://127.0.0.1:10000"
  let session = RemoteSession.new(addr);

  const cb = (keyexpr: String, value: Uint8Array) => {
    console.debug(">> [Subscriber] Received PUT ('" + keyexpr + "': '" + value + "')");
  };
 
  (await session).declare_subscriber("demo/1", callback);

  (await session).declare_subscriber("demo/2", callback);

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