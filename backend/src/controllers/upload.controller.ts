import { Request, Response, NextFunction } from 'express'
import cloudinary from '../config/cloudinary'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// ─── UPLOAD SINGLE IMAGE ─────────────────────────────────────────────────────
export const uploadImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next(new AppError('No image provided', 400))

    const folder = (req.query.folder as string) || 'shoppintrest'

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

    const folder = (req.query.folder as string) || 'shoppintrest/products'

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

    await cloudinary.uploader.destroy(publicId)
    sendSuccess(res, null, 'Image deleted successfully')
  }
)