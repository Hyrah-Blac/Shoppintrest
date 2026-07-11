import { Request, Response, NextFunction } from 'express'
import AppError from '../utils/AppError'

/**
 * A minimal, dependency-free request-body validator. No Zod/Joi/Yup
 * required — just a small rule DSL that covers what this codebase actually
 * needs (required fields, types, string length, numeric ranges, regex).
 *
 * Usage in a routes file:
 *
 *   import { validateBody } from '../middleware/validate'
 *
 *   router.post(
 *     '/mpesa/initiate',
 *     validateBody({
 *       phone: { type: 'string', required: true, pattern: /^\+?\d{9,12}$/ },
 *       shippingAddress: { type: 'object', required: true },
 *       'shippingAddress.fullName': { type: 'string', required: true, maxLength: 200 },
 *       'shippingAddress.line1':    { type: 'string', required: true, maxLength: 200 },
 *       'shippingAddress.city':     { type: 'string', required: true, maxLength: 100 },
 *       'shippingAddress.state':    { type: 'string', required: true, maxLength: 100 },
 *       'shippingAddress.postalCode': { type: 'string', required: true, maxLength: 20 },
 *     }),
 *     initiateMpesaPayment
 *   )
 *
 * This exists as a first validation layer BEFORE anything reaches Mongoose —
 * useful for rejecting obviously malformed input fast, with a clear message,
 * before a controller does any DB work. It does not replace the schema-level
 * rules in your Mongoose models (required/min/maxlength there still apply
 * and remain the source of truth for what's actually persisted).
 */

type FieldRule = {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
}

type Schema = Record<string, FieldRule>

const getByPath = (obj: any, path: string) =>
  path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)

export const validateBody = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = []

    for (const [path, rule] of Object.entries(schema)) {
      const value = getByPath(req.body, path)

      if (value === undefined || value === null || value === '') {
        if (rule.required) errors.push(`"${path}" is required`)
        continue
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`"${path}" must be a string`)
        continue
      }
      if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`"${path}" must be a number`)
        continue
      }
      if (rule.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`"${path}" must be a boolean`)
        continue
      }
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push(`"${path}" must be an array`)
        continue
      }
      if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`"${path}" must be an object`)
        continue
      }

      if (typeof value === 'string') {
        if (rule.minLength != null && value.length < rule.minLength) {
          errors.push(`"${path}" must be at least ${rule.minLength} characters`)
        }
        if (rule.maxLength != null && value.length > rule.maxLength) {
          errors.push(`"${path}" must be at most ${rule.maxLength} characters`)
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`"${path}" is not in a valid format`)
        }
      }

      if (typeof value === 'number') {
        if (rule.min != null && value < rule.min) {
          errors.push(`"${path}" must be at least ${rule.min}`)
        }
        if (rule.max != null && value > rule.max) {
          errors.push(`"${path}" must be at most ${rule.max}`)
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join('; '), 400))
    }

    next()
  }
}