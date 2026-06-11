import { Request, Response } from 'express'
import SupportTicket from '../models/SupportTicket'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// ─── ADMIN — GET ALL TICKETS (across every user) ─────────────────────────────
export const getAllTickets = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query

  const filter: Record<string, any> = {}
  if (status && status !== 'all') filter.status = status

  const tickets = await SupportTicket.find(filter)
    .populate('userId', 'username email displayName avatar')
    .sort({ createdAt: -1 })
    .lean()

  sendSuccess(res, tickets, 'Tickets fetched')
})

// ─── ADMIN — GET ONE TICKET (any user) ───────────────────────────────────────
export const getTicketAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params

  const ticket = await SupportTicket.findById(ticketId)
    .populate('userId', 'username email displayName avatar')
    .lean()

  if (!ticket) throw new AppError('Ticket not found', 404)

  sendSuccess(res, ticket, 'Ticket fetched')
})

// ─── ADMIN — CLOSE TICKET (any user) ─────────────────────────────────────────
export const closeTicketAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params

  const ticket = await SupportTicket.findById(ticketId)
  if (!ticket) throw new AppError('Ticket not found', 404)

  const { closeSupportChannel } = await import('../lib/stream')
  await closeSupportChannel(ticket.streamChannelId)

  ticket.status     = 'closed'
  ticket.resolvedAt = new Date()
  await ticket.save()

  sendSuccess(res, ticket, 'Ticket closed')
})