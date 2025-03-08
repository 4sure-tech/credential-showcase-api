import type { CorsOptions } from 'cors';

export const corsDisabled = process.env.CORS_DISABLED === 'true';
const allowOrigins = process.env.ALLOW_ORIGINS?.split(',') ?? ['*'];
const allowMethods = process.env.ALLOW_METHODS?.split(',') ?? ['GET', 'POST', 'PUT', 'DELETE'];
const allowHeaders = process.env.ALLOW_HEADERS?.split(',') ?? ['Content-Type', 'Authorization'];
const allowCredentials = process.env.ALLOW_CREDENTIALS === 'true';

export const corsOptions: CorsOptions = {
  origin: allowOrigins,
  methods: allowMethods,
  allowedHeaders: allowHeaders,
  credentials: allowCredentials,
};