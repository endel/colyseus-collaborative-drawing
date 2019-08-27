import { Client } from "colyseus.js";

export const client = new Client(`ws://${location.hostname}:8080`);