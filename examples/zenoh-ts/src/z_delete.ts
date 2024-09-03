import "./style.css";
import "./webpage.ts";

import { Config, Session } from "@ZettaScaleLabs/zenoh-ts";

export async function main_delete() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  await session.delete("demo/delete");
  await session.close();
}
