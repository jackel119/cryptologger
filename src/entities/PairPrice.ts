import { BaseEntity, Entity, Property, SerializedPrimaryKey } from "@mikro-orm/core";

@Entity()
export class PairPrice extends BaseEntity {

  @SerializedPrimaryKey()
  id: string;

  @Property()
  asset1: string;

  @Property()
  asset2: string;

  @Property({ default: "now" })
  created: Date;
}
