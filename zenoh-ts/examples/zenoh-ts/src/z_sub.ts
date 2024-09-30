import { RingChannel } from "../../../dist/pubsub";
import { deserialize_string } from "../../../dist/z_bytes";
import "./style.css";
import "./webpage.ts";

import { Sample, Config, Subscriber, Session, KeyExpr } from "@ZettaScaleLabs/zenoh-ts";

export async function main_sub() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));

  const callback = async function (sample: Sample): Promise<void> {
    console.log!(
      ">> [Subscriber] Received " +
      sample.kind() + " ('" +
      sample.keyexpr() + "': '" +
      sample.payload().deserialize(deserialize_string) + "')",
    );
  };

  let key_expr = KeyExpr.new("demo/example/zenoh-ts-sub");
  console.log("Declare Subscriber ", key_expr.toString());
  // Callback Subscriber take a callback which will be called upon every sample received.
  let callback_subscriber: Subscriber = await session.declare_subscriber(
    key_expr,
    callback,
  );

  await sleep(1000 * 3);
  callback_subscriber.undeclare();
  console.log("Undeclare callback_subscriber");

  // Poll Subscribers will only consume data on calls to receieve()
  // This means that interally the FIFO queue will fill up to the point that new values will be dropped
  // The dropping of these values occurs in the Remote-API Plugin
  let poll_subscriber: Subscriber = await session.declare_subscriber("demo/example/zenoh-ts-sub", new RingChannel(10));
  let sample = await poll_subscriber.receive();
  while (sample != undefined) {
    console.log!(
      ">> [Subscriber] Received " +
      sample.kind() + " ('" +
      sample.keyexpr() + "': '" +
      sample.payload().deserialize(deserialize_string) + "')",
    );
    sample = await poll_subscriber.receive();
  }

  poll_subscriber.undeclare();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
