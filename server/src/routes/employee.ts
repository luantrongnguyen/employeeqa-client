import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import prisma from '../db/prisma'
import { createNotification } from '../services/notificationService'
import { ok, created, notFound, badRequest, gone } from '../utils/response'
import { getIO } from '../socket'

const router = Router()

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const THREAD_EXPIRY_DAYS = 30

// Create new anonymous question
router.post('/questions', submitLimiter, async (req, res) => {
  const { content, imageUrl } = req.body as { content?: string; imageUrl?: string }

  if (!content?.trim() || content.trim().length < 10) {
    badRequest(res, 'content must be at least 10 characters')
    return
  }

  const accessToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + THREAD_EXPIRY_DAYS)

  const thread = await prisma.questionThread.create({
    data: {
      accessToken,
      expiresAt,
      messages: {
        create: {
          senderType: 'employee',
          content: content.trim(),
          imageUrl: imageUrl ?? null,
        },
      },
    },
    include: { messages: true },
  })

  await createNotification(thread.id, thread.messages[0].id, 'new_question')
  getIO().to('room:admin').emit('notification:new', { threadId: thread.id, type: 'new_question' })

  created(res, { accessToken: thread.accessToken })
})

// Get thread by access token
router.get('/questions/:accessToken', async (req, res) => {
  const accessToken = req.params['accessToken'] as string

  const thread = await prisma.questionThread.findUnique({
    where: { accessToken },
    include: {
      tags: { include: { tag: true } },
      messages: {
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
        include: { admin: { select: { displayName: true } } },
      },
    },
  })

  if (!thread || thread.status === 'hidden') {
    notFound(res)
    return
  }

  if (thread.expiresAt && thread.expiresAt < new Date()) {
    gone(res)
    return
  }

  ok(res, {
    id: thread.id,
    status: thread.status,
    isFeatured: thread.isFeatured,
    expiresAt: thread.expiresAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    tags: thread.tags.map((tt) => tt.tag),
    messages: thread.messages.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      senderType: m.senderType,
      adminId: m.adminId,
      adminDisplayName: m.admin?.displayName ?? null,
      content: m.content,
      imageUrl: m.imageUrl,
      isHidden: m.isHidden,
      createdAt: m.createdAt,
    })),
  })
})

// Employee sends follow-up
router.post('/questions/:accessToken/messages', submitLimiter, async (req, res) => {
  const accessToken = req.params['accessToken'] as string
  const { content, imageUrl } = req.body as { content?: string; imageUrl?: string }

  if (!content?.trim()) {
    badRequest(res, 'content is required')
    return
  }

  const thread = await prisma.questionThread.findUnique({ where: { accessToken } })

  if (!thread || thread.status === 'hidden') {
    notFound(res)
    return
  }

  if (thread.expiresAt && thread.expiresAt < new Date()) {
    gone(res)
    return
  }

  if (thread.status === 'closed') {
    badRequest(res, 'Thread is closed')
    return
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderType: 'employee',
      content: content.trim(),
      imageUrl: imageUrl ?? null,
    },
  })

  await prisma.questionThread.update({
    where: { id: thread.id },
    data: { status: 'open', updatedAt: new Date() },
  })

  await createNotification(thread.id, message.id, 'new_reply')

  const msgPayload = {
    id: message.id,
    threadId: thread.id,
    senderType: 'employee',
    adminId: null,
    adminDisplayName: null,
    content: message.content,
    imageUrl: message.imageUrl ?? null,
    imageOriginalName: null,
    isHidden: false,
    createdAt: message.createdAt.toISOString(),
  }
  getIO().to(`thread:${thread.id}`).emit('message:new', msgPayload)
  getIO().to('room:admin').emit('notification:new', { threadId: thread.id, type: 'new_reply' })

  ok(res, { id: message.id, createdAt: message.createdAt })
})

// Public featured questions
router.get('/featured', async (_req, res) => {
  const items = await prisma.featuredQuestion.findMany({
    where: { isVisible: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      thread: { include: { tags: { include: { tag: true } } } },
    },
  })

  ok(res, items.map((f) => ({
    id: f.id,
    threadId: f.threadId,
    publishedQuestion: f.publishedQuestion,
    publishedAnswer: f.publishedAnswer,
    publishedImageUrl: f.publishedImageUrl,
    isVisible: f.isVisible,
    displayOrder: f.displayOrder,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    tags: f.thread.tags.map((tt) => tt.tag),
  })))
})

// Public tags
router.get('/tags', async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { nameVi: 'asc' } })
  ok(res, tags)
})

export default router
