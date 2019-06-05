"use strict";

import redis from "redis";
import promise from "bluebird";
import env from "node-env-file";

env("./.env");

const REDIS_URL = process.env.REDIS_URL;

promise.promisifyAll(redis.RedisClient.prototype);
promise.promisifyAll(redis.Multi.prototype);

export let client = () => {
    return new Promise((resolve, reject) => {
        let connector = redis.createClient(REDIS_URL);

        connector.on("error", () => {
            reject("Redis Connection failed");
        });

        connector.on("connect", () => {
            resolve(connector);
        });
    });
};
