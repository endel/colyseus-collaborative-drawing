import { Client } from "colyseus.js";

const protocol = location.protocol.replace("http", "ws");
const port = (location.port && `:${location.port}`);
const host = location.hostname;
export const client = new Client(`${protocol}//${host}${port}`);