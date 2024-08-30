import "./style.css";
import "./webpage.ts";

import { Config, KeyExpr, Query, Queryable, Session, ZBytes } from "@ZettaScaleLabs/zenoh-ts";

type Option<T> = T | null;

export async function main() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));

  let key_expr = KeyExpr.new("demo/test/queryable");
  let queryable: Queryable = await session.declare_queryable(key_expr, true);
  const payload = [122, 101, 110, 111, 104];
  let query = await queryable.receive();
  while (query instanceof Query) {
    console.log("Query Payload");
    console.log(query.selector());
    let zbytes: Option<ZBytes> = query.payload();

    if (zbytes == null) {
      console.log!(`>> [Queryable ] Received Query ${query.selector()}`);
    } else {
      console.log!(
        `>> [Queryable ] Received Query ${query.selector()} with payload '${zbytes}'`,
      );
    }

    console.log(
      `>> [Queryable ] Responding ${key_expr.toString()} with payload '${payload}'`,
    );
    query.reply_del("demo/test/queryable");

    query = await queryable.receive();
  }
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.log(e);
    throw e;
  });
