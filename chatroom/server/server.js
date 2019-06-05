"use strict";

import express from "express";
import bodyParser from "body-parser";
import socket from "socket.io";
import path from "path";
import env from "node-env-file";
import { client } from "../lib/redis";
import * as routes from "./routes";
import * as AWSXRay from 'aws-xray-sdk'

env(".env");

const PORT = process.env.APP_PORT;

const app = express();
app.use(AWSXRay.express.openSegment('chatroom')); //required at the start of your routes

// view engine setup
app.set("views", path.join(__dirname, "../public/views"));
app.set("view engine", "pug");

// static files folder setup
app.use(express.static(path.join(__dirname, "../public/assets")));

// Middleware to parse request body
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

client().then(
    res => {
        // subscribe to Pub/Sub channels
        res.subscribe("chatMessages");
        res.subscribe("activeUsers");

        // App routes
        app.get("/", routes.home);
        app.get("/chat/:username", routes.chatRoom);
        app.get("/messages", routes.messages);
        app.get("/users", routes.users);
        app.post("/user", routes.createUser);
        app.delete("/user", routes.deleteUser);
        app.post("/message", routes.createMessage);

        //Start the server
        const server = app.listen(PORT, () => {
            console.log("Server Started");
        });

        const io = socket.listen(server);

        // //listen and emit messages and user events (leave or join) using socket.io
        io.on("connection", socket => {
            res.on("message", (channel, message) => {
                if (channel === "chatMessages") {
                    socket.emit("message", JSON.parse(message));
                } else {
                    socket.emit("users", JSON.parse(message));
                }
            });
        });
    },
    err => {
        console.log("Redis connection failed: ", err);
    }
);

app.use(AWSXRay.express.closeSegment()); //required at the end of your routes / first in error handling routes
