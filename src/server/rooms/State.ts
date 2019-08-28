import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Player } from "./Player";

export enum BRUSH {
  SKETCH = 's',
  MARKER = 'm',
  PEN = 'p',
  // ROUNDED = 'r',
}

export const DEFAULT_BRUSH = BRUSH.SKETCH;

export class Path extends Schema {
  @type("string") brush;
  @type("number") color: number;
  @type(["number"]) points = new ArraySchema<number>();
}

export class State extends Schema {
  @type("number") countdown: number;
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Path]) paths = new ArraySchema<Path>();

  createPlayer (sessionId: string) {
    this.players[sessionId] = new Player();
    return this.players[sessionId];
  }

  removePlayer (sessionId: string) {
    delete this.players[sessionId];
  }
}
