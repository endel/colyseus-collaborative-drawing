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
  @type("string") brush: string;
  @type("string") sessionId: string;
  @type("number") color: number;
  @type(["number"]) points = new ArraySchema<number>();
  @type("boolean") finished: boolean;
}

export class State extends Schema {
  @type("number") expiration: number;
  @type("number") countdown: number;
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Path]) paths = new ArraySchema<Path>();

  createPlayer (sessionId: string) {
    const player = new Player();
    this.players.set(sessionId, player);
    return player;
  }

  removePlayer (sessionId: string) {
    this.players.delete(sessionId);
  }
}
