import { Client } from "colyseus.js";

const port = (location.port && `:${location.port}`);
export const client = new Client(`ws://${location.hostname}${port}`);