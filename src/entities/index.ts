import { MikroORM } from "@mikro-orm/core";
import { PairPrice } from "./PairPrice";

export async function setupORM() {

  const orm = await MikroORM.init({
    entities: [PairPrice],
    dbName: "prices.sqlite",
    type: "sqlite",
  });

  return orm;
}
