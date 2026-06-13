import { Request, Response } from 'express'
import Saved from '../models/Saved'
import User from '../models/User'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// Slugify helper
const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const createFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const { name } = req.body
  if (!name) throw new AppError('Folder name is required', 400)

  const count = await Saved.countDocuments({ userId })
  if (count >= 50) throw new AppError('Maximum 50 folders allowed', 400)

  const slug = toSlug(name)
  const exists = await Saved.findOne({ userId, slug })
  if (exists) throw new AppError('A folder with that name already exists', 409)

  const folder = await Saved.create({ userId, name, slug, isDefault: false, products: [] })
  sendSuccess(res, folder, 'Folder created', 201)
})

export const getFolders = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const folders = await Saved.find({ userId }).sort({ isDefault: -1, createdAt: 1 })
  sendSuccess(res, folders, 'Folders fetched')
})

export const getFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const { slug } = req.params
  const page  = parseInt(req.query.page as string) || 1
  const limit = 20
  const skip  = (page - 1) * limit

  const folder = await Saved.findOne({ userId, slug })
    .populate({ path: 'products', options: { skip, limit } })
  if (!folder) throw new AppError('Folder not found', 404)

  sendSuccess(res, folder, 'Folder fetched')
})

export const renameFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const { slug } = req.params
  const { name } = req.body
  if (!name) throw new AppError('Name is required', 400)

  const folder = await Saved.findOne({ userId, slug })
  if (!folder) throw new AppError('Folder not found', 404)

  const newSlug = toSlug(name)
  const conflict = await Saved.findOne({ userId, slug: newSlug, _id: { $ne: folder._id } })
  if (conflict) throw new AppError('A folder with that name already exists', 409)

  folder.name = name
  folder.slug = newSlug
  await folder.save()
  sendSuccess(res, folder, 'Folder renamed')
})

export const deleteFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const { slug } = req.params

  const folder = await Saved.findOne({ userId, slug })
  if (!folder) throw new AppError('Folder not found', 404)
  if (folder.isDefault) throw new AppError('Default folder cannot be deleted', 400)

  await folder.deleteOne()
  sendSuccess(res, null, 'Folder deleted')
})

export const saveProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId        = (req as any).user._id
  const { productId } = req.params
  const { folderId }  = req.body

  await User.findByIdAndUpdate(userId, { $addToSet: { savedProducts: productId } })

  if (folderId) {
    const folder = await Saved.findOne({ _id: folderId, userId })
    if (folder) {
      if (folder.products.length >= 500) throw new AppError('Folder is full (max 500)', 400)
      await Saved.findByIdAndUpdate(folderId, { $addToSet: { products: productId } })
    }
  }

  sendSuccess(res, null, 'Product saved')
})

export const unsaveProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId        = (req as any).user._id
  const { productId } = req.params

  await User.findByIdAndUpdate(userId, { $pull: { savedProducts: productId } })
  await Saved.updateMany({ userId }, { $pull: { products: productId } })

  sendSuccess(res, null, 'Product unsaved')
})

export const moveProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId        = (req as any).user._id
  const { productId } = req.params
  const { fromSlug, toSlug: destSlug } = req.body

  const to = await Saved.findOne({ userId, slug: destSlug })
  if (!to) throw new AppError('Folder not found', 404)

  if (fromSlug) {
    const from = await Saved.findOne({ userId, slug: fromSlug })
    if (from) {
      await Saved.findByIdAndUpdate(from._id, { $pull: { products: productId } })
    }
  }

  await Saved.findByIdAndUpdate(to._id, { $addToSet: { products: productId } })

  sendSuccess(res, null, 'Product moved')
})

export const getAllSaved = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const page   = parseInt(req.query.page as string) || 1
  const limit  = 20

  const user = await User.findById(userId)
    .select('savedProducts')
    .populate({ path: 'savedProducts', options: { skip: (page - 1) * limit, limit } })
  if (!user) throw new AppError('User not found', 404)

  sendSuccess(res, user.savedProducts, 'Saved products fetched')
})