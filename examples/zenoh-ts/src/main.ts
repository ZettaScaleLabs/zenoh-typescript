import { Encoding } from "zenoh/encoding";
import "./style.css";
import "./webpage.ts";

import {
  Session,
  Config,
  Query,
  Sample,
  KeyExpr,
  Publisher,
  Subscriber,
  Receiver,
  RecvErr,
  Queryable,
} from "zenoh";

async function queryable_callback(query: Query) {
  console.log("  Query Receieved in Callback", query);
  query.reply(query.key_expr(), [65, 66, 67, 50]);
  console.log("  ");
}

async function main() {
  const subscriber_callback = async function (sample: Sample): Promise<void> {
    console.log("    cb demo 1 :  Key_expr ", sample.keyexpr());
    console.log("    cb demo 1 :  Value    ", sample.payload());
  };

  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  // KeyExpr
  let key_exp = KeyExpr.new("demo/put");

  // Session put / del / get
  // await session.put("demo/put", [65, 66, 67, 49]);
  // await session.put(key_exp, [65, 66, 67, 50]);
  // await session.delete("demo/delete");

  // console.log("Issue Get");
  // let receiver: Receiver = await session.get("test/queryable/**");
  // let stop = false;
  // while (!stop) {
  //   let reply = await receiver.receive();

  //   if (reply == RecvErr.Disconnected) {
  //     console.log("All Replies Receved");
  //     stop = true;
  //   } else if (reply == RecvErr.MalformedReply) {
  //     console.log("MalformedReply");
  //   } else {
  //     console.log("Reply Value ", reply.result());
  //   };
  // }

  // // subscribers
  // let callback_subscriber: Subscriber = await session.declare_subscriber("demo/pub", subscriber_callback);
  // await sleep(1000 * 3);
  // callback_subscriber.undeclare()
  // console.log("undeclare callback_subscriber");

  // let poll_subscriber: Subscriber = await session.declare_subscriber("demo/pub");
  // let value = await poll_subscriber.recieve();
  // console.log("poll_subscriber", value);
  // console.log(await poll_subscriber.recieve());
  // poll_subscriber.undeclare()

  // // // publisher
  let publisher: Publisher = await session.declare_publisher("demo/pub/1");
  // await publisher.put("This is typescript string");
  // await publisher.put(new String("This is typescript String ()"));
  // await publisher.put([65, 66, 67, 49]);
  // With encoding and attachment
  await publisher.put(
    [65, 66, 67, 49],
    Encoding.APPLICATION_JSON(),
    [12, 234, 5],
  );
  // await publisher.undeclare();

  // queryable
  console.log("declare queryable");
  let queryable: Queryable = await session.declare_queryable(
    "demo/test/queryable",
    true,
  );
  let query = await queryable.recieve();
  if (query instanceof Query) {
    // query.reply_err("Demo Test 1234")
    // query.reply("demo/test/queryable", "Demo Test 1234")
    query.reply_del("demo/test/queryable");
  }

  // Declare a Queryable with a Callback, this will continue to run until the queryable falls out of scope
  // let queryable_with_callback: Queryable = await session.declare_queryable("demo/test/queryable", true, queryable_callback);

  // Loop to spin and keep alive
  var count = 0;
  while (true) {
    var seconds = 100;
    await sleep(1000 * seconds);
    console.log("Main Loop ? ", count);
    count = count + 1;
  }
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.log(e);
    throw e;
  });

function executeAsync(func: any) {
  setTimeout(func, 0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
