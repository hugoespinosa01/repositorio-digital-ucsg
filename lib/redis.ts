import {Redis} from "ioredis"

const getRedisUrl = () => {
    if (process.env.REDIS_URL){
        return process.env.REDIS_URL || "redis://localhost:6379"
    }

    throw new Error("REDIS_URL is not defined");
}

export const redis = new Redis(getRedisUrl());