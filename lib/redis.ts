import { Redis } from "ioredis"
import dotenv from 'dotenv';

dotenv.config();

const getRedisUrl = () => {
    return process.env.REDIS_URL || "redis://localhost:6379"
}

export const redis = new Redis(getRedisUrl());