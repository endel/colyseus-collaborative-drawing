import { Client } from "colyseus.js";

const protocol = location.protocol.replace("http", "ws");
const endpoint = (process.env.NODE_ENV !== "production")
    ? "localhost:2567" // development
    : "xxx.colyseus.dev" // production

export const client = new Client(`${protocol}//${endpoint}`);