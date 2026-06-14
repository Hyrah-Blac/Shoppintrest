import { Request, Response, NextFunction } from 'express'
import cloudinary from '../config/cloudinary'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// FIX 1 — allowed MIME types. Multer passes the detected mimetype;
// we validate it here as a second layer even if multer's fileFilter runs first.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

// FIX 2 — allowed Cloudinary folder destinations.
// The folder param comes from the query string — sanitize it against
// a whitelist so users can't inject arbitrary paths.
const ALLOWED_FOLDERS = new Set([
  'shoppintrest',
  'shoppintrest/products',
  'shoppintrest/avatars',
  'shoppintrest/collections',
])

function getSafeFolder(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback
  return ALLOWED_FOLDERS.has(raw) ? raw : fallback
}

// ─── UPLOAD SINGLE IMAGE ─────────────────────────────────────────────────────
export const uploadImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next(new AppError('No image provided', 400))

    // FIX 1 — validate MIME type
    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return next(new AppError('Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF are allowed.', 400))
    }

    // FIX 2 — sanitize folder against whitelist
    const folder = getSafeFolder(req.query.folder as string, 'shoppintrest')

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(req.file!.buffer)
    })

    sendSuccess(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
      'Image uploaded successfully',
      201
    )
  }
)

// ─── UPLOAD MULTIPLE IMAGES ──────────────────────────────────────────────────
export const uploadMultipleImages = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('No images provided', 400))
    }

    if (req.files.length > 10) {
      return next(new AppError('Maximum 10 images allowed', 400))
    }

    // FIX 1 — validate MIME type for every file
    const invalidFile = (req.files as Express.Multer.File[]).find(
      (f) => !ALLOWED_MIME_TYPES.has(f.mimetype)
    )
    if (invalidFile) {
      return next(new AppError(`Invalid file type: ${invalidFile.originalname}. Only JPEG, PNG, WebP, AVIF, and GIF are allowed.`, 400))
    }

    // FIX 2 — sanitize folder against whitelist
    const folder = getSafeFolder(req.query.folder as string, 'shoppintrest/products')

    const uploads = await Promise.all(
      (req.files as Express.Multer.File[]).map(
        (file) =>
          new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                transformation: [
                  { width: 2000, height: 2000, crop: 'limit' },
                  { quality: 'auto', fetch_format: 'auto' },
                ],
              },
              (error, result) => {
                if (error) reject(error)
                else resolve(result)
              }
            )
            stream.end(file.buffer)
          })
      )
    )

    const images = uploads.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }))

    sendSuccess(res, images, 'Images uploaded successfully', 201)
  }
)

// ─── DELETE IMAGE ────────────────────────────────────────────────────────────
export const deleteImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { publicId } = req.body
    if (!publicId) return next(new AppError('Public ID is required', 400))

    // FIX 3 — confirm the publicId belongs to one of our allowed folders
    // so a user can't delete arbitrary assets from the Cloudinary account.
    const isOwned = [...ALLOWED_FOLDERS].some((folder) =>
      publicId.startsWith(folder + '/')
    )
    if (!isOwned) {
      return next(new AppError('You do not have permission to delete this asset.', 403))
    }

    await cloudinary.uploader.destroy(publicId)
    sendSuccess(res, null, 'Image deleted successfully')
  }
)