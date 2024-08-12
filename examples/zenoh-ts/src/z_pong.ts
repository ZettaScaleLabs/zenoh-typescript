import { Encoding } from "zenoh/encoding";
import "./style.css";
import "./webpage.ts";

import { Config, Session } from "zenoh";
import { CongestionControl, Sample } from "zenoh/sample";

export async function main() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));

  let pub = await session.declare_publisher(
    "test/ping",
    Encoding.default(),
    CongestionControl.BLOCK,
  );

  const subscriber_callback = async function (sample: Sample): Promise<void> {
    await pub.put(sample.payload());
  };

  await session.declare_subscriber("test/pong", subscriber_callback);

  var count = 0;
  while (true) {
    var seconds = 100;
    await sleep(1000 * seconds);
    count = count + 1;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.log(e);
    throw e;
  });