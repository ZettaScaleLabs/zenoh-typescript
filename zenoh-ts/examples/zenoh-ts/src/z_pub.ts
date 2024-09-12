import "./style.css";
import "./webpage.ts";

import { Encoding, CongestionControl, Config, KeyExpr, Publisher, Session } from "@ZettaScaleLabs/zenoh-ts";

export async function main_pub() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));

  let key_expr = KeyExpr.new("demo/ping");
  let publisher: Publisher = await session.declare_publisher(
    key_expr,
    Encoding.default(),
    CongestionControl.BLOCK,
  );

  const payload = [122, 101, 110, 111, 104];

  for (let idx = 0; idx < Number.MAX_VALUE; idx++) {
    let buf = `[${idx}] ${payload}`;

    console.log("Block statement execution no : " + idx);
    console.log(`Putting Data ('${key_expr}': '${buf}')...`);
    publisher.put(buf);
    sleep(1000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
