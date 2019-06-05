"use strict";

import { client } from "../lib/redis";

export let fetchMessages = () => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res.lrangeAsync("messages", 0, -1).then(
                    messages => {
                        console.log(messages);
                        resolve(messages);
                    },
                    err => {
                        reject(err);
                    }
                );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};

export let addMessage = message => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res
                    .multi()
                    .rpush("messages", message)
                    .execAsync()
                    .then(
                        res => {
                            resolve(res);
                        },
                        err => {
                            reject(err);
                        }
                    );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};

export let fetchActiveUsers = () => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res.smembersAsync("users").then(
                    users => {
                        resolve(users);
                    },
                    err => {
                        reject(err);
                    }
                );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};

export let addActiveUser = user => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res
                    .multi()
                    .sadd("users", user)
                    .execAsync()
                    .then(
                        res => {
                            if (res[0] === 1) {
                                resolve("User added");
                            }

                            reject("User already in list");
                        },
                        err => {
                            reject(err);
                        }
                    );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};

export let removeActiveUser = user => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res
                    .multi()
                    .srem("users", user)
                    .execAsync()
                    .then(
                        res => {
                            if (res === 1) {
                                resolve("User removed");
                            }
                            reject("User is not in list");
                        },
                        err => {
                            reject(err);
                        }
                    );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};
