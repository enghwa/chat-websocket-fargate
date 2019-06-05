"use strict";

import express from "express";
import { client } from "../lib/redis";
import * as helper from "../lib/functions";

const router = express.Router();

let fetchMessages = () => {
    return helper.fetchMessages().then(
        res => {
            return res;
        },
        err => {
            console.log(err);
        }
    );
};

let fetchUsers = () => {
    return helper.fetchActiveUsers().then(
        res => {
            return res;
        },
        err => {
            console.log(err);
        }
    );
};

export let home = router.get("/", (req, res) => {
    res.render("index", { title: "Chat Room" });
});

export let chatRoom = router.get("/chat/:username", (req, res) => {
    res.render("room", { user: req.params.username });
});

export let messages = router.get("/messages", (req, res) => {
    fetchMessages().then(messages => {
        res.send(messages);
    });
});

export let users = router.get("/users", (req, res) => {
    fetchUsers().then(u => {
        res.send(u);
    });
});

export let createUser = router.post("/user", (req, res) => {
    let users;
    let user = req.body.user;

    fetchUsers().then(u => {
        users = u;
        if (users.indexOf(user) === -1) {
            helper.addActiveUser(user).then(
                () => {
                    client().then(
                        client => {
                            let msg = {
                                message:
                                    req.body.user +
                                    " just joined the chat room",
                                user: "system"
                            };

                            client.publish("chatMessages", JSON.stringify(msg));
                            client.publish(
                                "activeUsers",
                                JSON.stringify(fetchUsers())
                            );

                            helper.addMessage(JSON.stringify(msg)).then(
                                () => {
                                    res.send({
                                        status: 200,
                                        message: "User joined"
                                    });
                                },
                                err => {
                                    console.log(err);
                                }
                            );
                        },
                        err => {
                            console.log(err);
                        }
                    );
                },
                err => {
                    console.log(err);
                }
            );
        } else {
            res.send({ status: 403, message: "User already exist" });
        }
    });
});

export let deleteUser = router.delete("/user", (req, res) => {
    let users;
    let user = req.body.user;

    fetchUsers().then(u => {
        users = u;

        if (users.indexOf(user) !== -1) {
            helper.removeActiveUser(user).then(
                () => {
                    client().then(
                        client => {
                            let msg = {
                                message:
                                    req.body.user + " just left the chat room",
                                user: "system"
                            };

                            client.publish("chatMessages", JSON.stringify(msg));
                            client.publish(
                                "activeUsers",
                                JSON.stringify(fetchUsers())
                            );

                            helper.addMessage(JSON.stringify(msg)).then(
                                () => {
                                    res.send({
                                        status: 200,
                                        message: "User removed"
                                    });
                                },
                                err => {
                                    console.log(err);
                                }
                            );
                        },
                        err => {
                            console.log(err);
                        }
                    );
                },
                err => {
                    console.log(err);
                }
            );
        } else {
            res.send({ status: 403, message: "User does not exist" });
        }
    });
});

export let createMessage = router.post("/message", (req, res) => {
    let msg = {
        message: req.body.msg,
        user: req.body.user
    };

    client().then(
        client => {
            client.publish("chatMessages", JSON.stringify(msg));

            helper.addMessage(JSON.stringify(msg)).then(
                () => {
                    res.send({
                        status: 200,
                        message: "Message sent"
                    });
                },
                err => {
                    console.log(err);
                }
            );
        },
        err => {
            console.log(err);
        }
    );
});
