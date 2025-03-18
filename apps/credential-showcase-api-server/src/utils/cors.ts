import type { CorsOptions } from 'cors'

export const corsOptions: CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOW_ORIGINS?.split(',') ?? ['*']

    if (!requestOrigin || process.env.CORS_DISABLED === 'true') return callback(null, true)
    if (allowedOrigins.indexOf(requestOrigin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  methods: process.env.ALLOW_METHODS?.split(',') ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: process.env.ALLOW_HEADERS?.split(',') ?? ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: process.env.ALLOW_CREDENTIALS === 'true',
}
