import { Schema, type } from "@colyseus/schema";
import { Path } from "./State";

export class Player extends Schema {
  @type("string") name: string;
  lastPath: Path;
}
