import { Redis } from "ioredis"
import dotenv from 'dotenv';

dotenv.config();

const getRedisUrl = () => {

    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL
    } else {
        throw new Error('No se ha definido la variable de entorno REDIS_URL')
    }
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
    maxRetriesPerRequest: 20000,
    // Tiempo de espera para conexión
    connectTimeout: 10000,
};

export const redis = new Redis(getRedisUrl(), redisConfig);