import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import AppError from '../utils/AppError'
import logger from '../utils/logger'

const handleCastErrorDB = (err: mongoose.Error.CastError) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err: any) => {
  const field = Object.keys(err.keyValue)[0]
  const message = `${field} already exists. Please use a different value.`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err: mongoose.Error.ValidationError) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401)

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401)

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  // FIX — split log level by severity so 4xx operational errors don't
  // flood error.log. Only true server errors (5xx) go to logger.error.
  const logLine = `${err.statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`
  if (err.statusCode >= 500) {
    logger.error(logLine)
  } else {
    logger.warn(logLine)
  }

  let error = { ...err, message: err.message }

  if (error.name === 'CastError')       error = handleCastErrorDB(error)
  if (error.code === 11000)             error = handleDuplicateFieldsDB(error)
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
  if (error.name === 'JsonWebTokenError') error = handleJWTError()
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode,
    })
  }

  // Unknown / programming error — don't leak details to client
  logger.error('UNEXPECTED ERROR:', err)
  return res.status(500).json({
    success: false,
    message: 'Something went very wrong. Please try again later.',
    statusCode: 500,
  })
}

export default globalErrorHandler