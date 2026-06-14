import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = winston.format
const isDev = process.env.NODE_ENV !== 'production'

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

// FIX — colorize only in development. In production, ANSI escape codes
// pollute log files and make them unreadable by log aggregators (Datadog,
// Papertrail, Render's log drain, etc.).
const consoleFormat = isDev
  ? combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    )
  : combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    )

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'warn',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

export default logger