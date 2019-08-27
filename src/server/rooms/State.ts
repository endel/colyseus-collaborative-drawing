import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

import { Player } from "./Player";

export class Path extends Schema {
  @type("uint8") brush = 0;
  @type("number") userId: number;
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
