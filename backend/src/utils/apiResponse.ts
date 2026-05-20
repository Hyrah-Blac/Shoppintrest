import { Response } from 'express'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: Record<string, string>
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
  })
}

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  return res.status(200).json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
  })
}