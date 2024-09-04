import "./style.css";
import "./webpage.ts";

import { Config, Receiver, RecvErr, Session } from "@ZettaScaleLabs/zenoh-ts";

export async function main_get() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  
    let receiver: Receiver = await session.get("test/queryable/**");

  let stop = false;

  while (!stop) {
    let reply = await receiver.receive();

    if (reply == RecvErr.Disconnected) {
      console.log("All Replies Receved");
      stop = true;
    } else if (reply == RecvErr.MalformedReply) {
      console.log("MalformedReply");
    } else {
      console.log("Reply Value ", reply.result());
    }
  }
}
