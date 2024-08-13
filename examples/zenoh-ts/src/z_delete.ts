import "./style.css";
import "./webpage.ts";

import { Config, Session } from "@ZettaScaleLabs/zenoh-ts";

async function main() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  await session.delete("demo/delete");
  await session.close();
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.log(e);
    throw e;
  });
