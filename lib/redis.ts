import { Redis } from "ioredis"
import dotenv from 'dotenv';

dotenv.config();

const getRedisUrl = () => {
    return process.env.REDIS_URL || "rediss://default:AXHgAAIjcDFiMDFlODEyNDI5MWU0NzU4OGZkOWVlMjFhOGM4Mjc5NHAxMA@integral-termite-29152.upstash.io:6379"
}

// Configuración para Redis
const redisConfig = {
    // Necesario para conexiones SSL (Upstash usa SSL)
    tls: {
        rejectUnauthorized: false
    },
    // Estrategia de reconexión
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Tiempo máximo de reconexión
    maxRetriesPerRequest: 3,
    // Tiempo de espera para conexión
    connectTimeout: 10000,
};

export const redis = new Redis(getRedisUrl(), redisConfig);