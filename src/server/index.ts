/*
 * embed webpack-dev-server
 */
let webpack, webpackDevMiddleware, webpackHotMiddleware, webpackConfig;
if (process.env.NODE_ENV !== "production") {
    webpack = require("webpack");
    webpackDevMiddleware = require("webpack-dev-middleware");
    webpackConfig = require("../../webpack.config");
    webpackHotMiddleware = require("webpack-hot-middleware");
}

import { Server } from "colyseus";
import http from "http";
import express from "express";
import path from "path";
import basicAuth from "express-basic-auth";
import socialRoutes from "@colyseus/social/express";
import { monitor } from "@colyseus/monitor";
import mongoose from 'mongoose';

import { DrawingRoom } from "./rooms/DrawingRoom";
import Drawing from "./db/Drawing";

export const port = Number(process.env.PORT || 8080);
export const endpoint = "localhost";

export let STATIC_DIR: string;

/**
 * Connect to MongoDB
 */
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/colyseus', {
  autoIndex: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useNewUrlParser: true,
});

const app = express();
const gameServer = new Server({ server: http.createServer(app) });

gameServer.define("2minutes", DrawingRoom, { expiration: 60 * 2 });
gameServer.define("5minutes", DrawingRoom, { expiration: 60 * 5 });
gameServer.define("1hour", DrawingRoom, { expiration: 60 * 60 });
gameServer.define("1day", DrawingRoom, { expiration: 60 * 60 * 24 });
gameServer.define("1week", DrawingRoom, { expiration: 60 * 60 * 24 * 7 });

if (process.env.NODE_ENV !== "production") {
    const webpackCompiler = webpack(webpackConfig({}));
    app.use(webpackDevMiddleware(webpackCompiler, {}));
    app.use(webpackHotMiddleware(webpackCompiler));

    // on development, use "../../" as static root
    STATIC_DIR = path.resolve(__dirname, "..", "..");

} else {
    // on production, use ./public as static root
    STATIC_DIR = path.resolve(__dirname, "public");
}

app.use("/", express.static(STATIC_DIR));

// @colyseus/social routes
app.use("/", socialRoutes);

app.get('/drawings', async (req, res) => {
  res.json(await Drawing.find({}, {
    _id: 1,
    mode: 1,
    createdAt: 1,
  }).sort({
    createdAt: -1
  }));
});

app.get('/drawings/:id', async (req, res) => {
  res.json(await Drawing.findOne({ _id: req.params.id }));
});

// add colyseus monitor
const auth = basicAuth({ users: { 'admin': 'admin' }, challenge: true });
app.use("/colyseus", auth, monitor(gameServer));

gameServer.listen(port);
console.log(`Listening on http://${endpoint}:${port}`);
