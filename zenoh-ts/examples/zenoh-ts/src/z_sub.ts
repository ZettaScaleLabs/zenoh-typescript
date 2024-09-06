import { FifoChannel, RingChannel } from "../../../dist/pubsub";
import { TextDeserializer } from "../../../dist/z_bytes";
import "./style.css";
import "./webpage.ts";

import { Sample, Config, Subscriber, Session } from "@ZettaScaleLabs/zenoh-ts";

export async function main_sub() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));

  const subscriber_callback = async function (sample: Sample): Promise<void> {
    console.log!(
      ">> [Subscriber] Received " +
      sample.kind() + " ('" +
      sample.keyexpr() + "': '" +
      sample.payload().deserialize(new TextDeserializer()) + "')",
    );
  };

  // Callback Subscriber take a callback which will be called upon every sample received.
  let callback_subscriber: Subscriber = await session.declare_subscriber(
    "demo/pub",
    new FifoChannel(10),
    subscriber_callback,
  );
  await sleep(1000 * 3);
  callback_subscriber.undeclare();
  console.log("undeclare callback_subscriber");

  // Poll Subscribers will only consume data on calls to receieve()
  // This means that interally the FIFO queue will fill up to the point that new values will be dropped
  // The dropping of these values occurs in the Remote-API Plugin
  let poll_subscriber: Subscriber =
    await session.declare_subscriber("demo/pub", new RingChannel(10));
  let sample = await poll_subscriber.receive();
  while (sample != undefined) {
    console.log!(
      ">> [Subscriber] Received " +
      sample.kind() + " ('" +
      sample.keyexpr() + "': '" +
      sample.payload().deserialize(new TextDeserializer()) + "')",
    );
    sample = await poll_subscriber.receive();
  }

  poll_subscriber.undeclare();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
