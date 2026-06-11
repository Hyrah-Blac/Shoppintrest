import { Request, Response } from 'express'
import SupportTicket from '../models/SupportTicket'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'
import {
  createSupportChannel,
  assignAgentToChannel,
  closeSupportChannel,
  getSupportToken,
} from '../lib/stream'

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()
  const { category, orderId } = req.body
  if (!category) throw new AppError('Category is required', 400)

  const channelId = await createSupportChannel(userId, category, orderId)

  const ticket = await SupportTicket.create({
    userId,
    streamChannelId: channelId,
    category,
    orderId: orderId ?? null,
  })

  sendSuccess(res, ticket, 'Ticket created', 201)
})

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const userId  = req.user._id.toString()
  const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 })
  sendSuccess(res, tickets, 'Tickets fetched')
})

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()
  const { ticketId } = req.params

  const ticket = await SupportTicket.findOne({ _id: ticketId, userId })
  if (!ticket) throw new AppError('Ticket not found', 404)

  sendSuccess(res, ticket, 'Ticket fetched')
})

export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()
  const { ticketId } = req.params

  const ticket = await SupportTicket.findOne({ _id: ticketId, userId })
  if (!ticket) throw new AppError('Ticket not found', 404)

  await closeSupportChannel(ticket.streamChannelId)
  ticket.status     = 'closed'
  ticket.resolvedAt = new Date()
  await ticket.save()

  sendSuccess(res, ticket, 'Ticket closed')
})

export const assignAgent = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params
  const { agentId }  = req.body
  if (!agentId) throw new AppError('agentId is required', 400)

  const ticket = await SupportTicket.findById(ticketId)
  if (!ticket) throw new AppError('Ticket not found', 404)

  await assignAgentToChannel(ticket.streamChannelId, agentId)
  ticket.agentId = agentId
  ticket.status  = 'pending'
  await ticket.save()

  sendSuccess(res, ticket, 'Agent assigned')
})

export const getStreamToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()
  const token  = await getSupportToken(userId)
  sendSuccess(res, { token }, 'Token generated')
})