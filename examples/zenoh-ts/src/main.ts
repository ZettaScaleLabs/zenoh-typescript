import './style.css'
import './webpage.ts'

import * as zenoh from "../../../esm"
// import { Sample, KeyExpr, Subscriber, Publisher } from "../../../esm"
import { Subscriber, Publisher } from "../../../esm/pubsub"
import { KeyExpr } from "../../../esm/key_expr"
import { Sample } from "../../../esm/sample"
import { Query, Queryable } from "../../../esm/query"


function queryable_callback(query: Query ) : Promise<void> {
    console.log("  Query Receieved");

    query.reply(
      query.key_expr() ,
      [65, 66, 67, 50]
    );
    console.log("  ");
}

async function main() {

  const subscriber_callback = async function (sample: Sample): Promise<void> {
    console.log("    cb demo 1 :  Key_expr ", sample.keyexpr());
    console.log("    cb demo 1 :  Value    ", sample.payload());
  }

  const session = await zenoh.Session.open(zenoh.Config.new("ws/127.0.0.1:10000"));
  // KeyExpr
  let key_exp = KeyExpr.new("demo/put");

  // Session put / del / get
  // await session.put("demo/put", [65, 66, 67, 49]);
  // await session.put(key_exp, [65, 66, 67, 50]);
  // await session.delete("demo/delete");

  // subscribers
  // let callback_subscriber: Subscriber = await session.declare_subscriber("demo/pub", callback);
  // await sleep(1000 * 3);
  // callback_subscriber.undeclare()

  // let poll_subscriber: Subscriber = await session.declare_subscriber("demo/pub");
  // let value = await poll_subscriber.recieve();
  // console.log("poll_subscriber", value);
  // console.log(await poll_subscriber.recieve());
  // poll_subscriber.undeclare()

  // publisher
  // let publisher: Publisher = await session.declare_publisher("demo/pub/1");
  // await publisher.put("This is typescript string");
  // await publisher.put(new String("This is typescript String ()"));
  // await publisher.put([65, 66, 67, 49]);
  // await publisher.undeclare();

  // queryable
  let queryable: Queryable = await session.declare_queryable("demo/test/queryable", true, queryable_callback );


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