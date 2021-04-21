import path from "path";
import express from "express";

import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";

/**
 * Import your Room files
 */
import { DrawingRoom } from "./rooms/DrawingRoom";

export default Arena({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define("10minutes", DrawingRoom, { expiration: 60 * 10 });
        gameServer.define("30minutes", DrawingRoom, { expiration: 60 * 30 });
        gameServer.define("1hour", DrawingRoom, { expiration: 60 * 60 });
        gameServer.define("1day", DrawingRoom, { expiration: 60 * 60 * 24 });
        gameServer.define("1week", DrawingRoom, { expiration: 60 * 60 * 24 * 7 });
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        // serve static files under ../static folder
        app.use("/", express.static(path.resolve(__dirname, "..", "static")));

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});