import { Router } from 'express'
import prisma from '../../db/prisma'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import { ok, notFound, badRequest, conflict } from '../../utils/response'
import { getIO } from '../../socket'
import type { ThreadStatus, Prisma } from '@prisma/client'

const router = Router()
router.use(requireAuth)

const THREAD_STATUS_VALUES: ThreadStatus[] = ['open', 'answered', 'hidden', 'closed']

// List threads with filters
router.get('/', async (req: AuthRequest, res) => {
  const { date, status, tagIds, keyword, page = '1', pageSize = '20' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const size = Math.min(100, Math.max(1, parseInt(pageSize)))

  const where: Prisma.QuestionThreadWhereInput = {}

  if (date) {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    where.createdAt = { gte: start, lt: end }
  }

  if (status && status !== 'all' && THREAD_STATUS_VALUES.includes(status as ThreadStatus)) {
    where.status = status as ThreadStatus
  }

  if (tagIds) {
    const ids = tagIds.split(',').filter(Boolean)
    if (ids.length > 0) {
      where.tags = { some: { tagId: { in: ids } } }
    }
  }

  if (keyword) {
    where.messages = { some: { content: { contains: keyword, mode: 'insensitive' } } }
  }

  const [threads, total] = await Promise.all([
    prisma.questionThread.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * size,
      take: size,
      include: {
        tags: { include: { tag: true } },
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true, imageUrl: true },
        },
      },
    }),
    prisma.questionThread.count({ where }),
  ])

  res.json({
    data: threads.map((t) => ({
      id: t.id,
      accessToken: t.accessToken,
      status: t.status,
      isFeatured: t.isFeatured,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      tags: t.tags.map((tt) => tt.tag),
      messageCount: t._count.messages,
      messages: t.messages,
    })),
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  })
})

// Get thread detail
router.get('/:threadId', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string

  const thread = await prisma.questionThread.findUnique({
    where: { id: threadId },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { admin: { select: { id: true, displayName: true } } },
      },
    },
  })

  if (!thread) {
    notFound(res)
    return
  }

  ok(res, {
    id: thread.id,
    accessToken: thread.accessToken,
    status: thread.status,
    isFeatured: thread.isFeatured,
    expiresAt: thread.expiresAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    tags: thread.tags.map((tt) => tt.tag),
    messageCount: thread._count.messages,
    messages: thread.messages.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      senderType: m.senderType,
      adminId: m.adminId,
      adminDisplayName: m.admin?.displayName ?? null,
      content: m.content,
      imageUrl: m.imageUrl,
      imageOriginalName: m.imageOriginalName,
      isHidden: m.isHidden,
      createdAt: m.createdAt,
    })),
  })
})

// Update thread status
router.patch('/:threadId/status', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string
  const { status } = req.body as { status?: ThreadStatus }

  if (!status || !THREAD_STATUS_VALUES.includes(status)) {
    badRequest(res, 'Invalid status')
    return
  }

  const thread = await prisma.questionThread.findUnique({ where: { id: threadId } })
  if (!thread) {
    notFound(res)
    return
  }

  const updated = await prisma.questionThread.update({
    where: { id: threadId },
    data: { status },
  })

  getIO().to(`thread:${threadId}`).emit('thread:status', { threadId, status: updated.status })

  ok(res, { status: updated.status })
})

// Admin reply to thread
router.post('/:threadId/messages', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string
  const { content, imageUrl } = req.body as { content?: string; imageUrl?: string }

  if (!content?.trim()) {
    badRequest(res, 'content is required')
    return
  }

  const thread = await prisma.questionThread.findUnique({ where: { id: threadId } })
  if (!thread) {
    notFound(res)
    return
  }

  if (thread.status === 'closed' || thread.status === 'hidden') {
    badRequest(res, 'Cannot reply to a closed or hidden thread')
    return
  }

  const message = await prisma.message.create({
    data: {
      threadId,
      senderType: 'admin',
      adminId: req.admin!.adminId,
      content: content.trim(),
      imageUrl: imageUrl ?? null,
    },
    include: { admin: { select: { displayName: true } } },
  })

  await prisma.questionThread.update({
    where: { id: threadId },
    data: { status: 'answered', updatedAt: new Date() },
  })

  const msgPayload = {
    id: message.id,
    threadId: message.threadId,
    senderType: message.senderType,
    adminId: message.adminId,
    adminDisplayName: message.admin?.displayName ?? null,
    content: message.content,
    imageUrl: message.imageUrl ?? null,
    imageOriginalName: null,
    isHidden: message.isHidden,
    createdAt: message.createdAt.toISOString(),
  }
  getIO().to(`thread:${threadId}`).emit('message:new', msgPayload)

  ok(res, msgPayload)
})

// Assign tags to thread (replaces all)
router.post('/:threadId/tags', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string
  const { tagIds } = req.body as { tagIds?: string[] }

  if (!Array.isArray(tagIds)) {
    badRequest(res, 'tagIds must be an array')
    return
  }

  const thread = await prisma.questionThread.findUnique({ where: { id: threadId } })
  if (!thread) {
    notFound(res)
    return
  }

  await prisma.$transaction([
    prisma.threadTag.deleteMany({ where: { threadId } }),
    ...(tagIds.length > 0
      ? [prisma.threadTag.createMany({
          data: tagIds.map((tagId: string) => ({ threadId, tagId })),
          skipDuplicates: true,
        })]
      : []),
  ])

  const tags = await prisma.threadTag.findMany({
    where: { threadId },
    include: { tag: true },
  })

  ok(res, tags.map((tt) => tt.tag))
})

// Remove a single tag
router.delete('/:threadId/tags/:tagId', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string
  const tagId = req.params['tagId'] as string

  await prisma.threadTag.deleteMany({ where: { threadId, tagId } })
  ok(res, null)
})

// Remove from featured (by threadId)
router.delete('/:threadId/feature', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string

  const featured = await prisma.featuredQuestion.findUnique({ where: { threadId } })
  if (!featured) {
    notFound(res)
    return
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.$transaction([
    prisma.featuredQuestion.delete({ where: { id: featured.id } }),
    prisma.questionThread.update({
      where: { id: threadId },
      data: { isFeatured: false, expiresAt },
    }),
  ])

  ok(res, null)
})

// Add to featured
router.post('/:threadId/feature', async (req: AuthRequest, res) => {
  const threadId = req.params['threadId'] as string
  const { publishedQuestion, publishedAnswer, publishedImageUrl, tagIds, isVisible } =
    req.body as {
      publishedQuestion?: string
      publishedAnswer?: string
      publishedImageUrl?: string
      tagIds?: string[]
      isVisible?: boolean
    }

  if (!publishedQuestion?.trim() || !publishedAnswer?.trim()) {
    badRequest(res, 'publishedQuestion and publishedAnswer are required')
    return
  }

  const thread = await prisma.questionThread.findUnique({ where: { id: threadId } })
  if (!thread) {
    notFound(res)
    return
  }

  if (thread.isFeatured) {
    conflict(res, 'Thread is already featured')
    return
  }

  const maxOrder = await prisma.featuredQuestion.aggregate({ _max: { displayOrder: true } })
  const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

  await prisma.$transaction(async (tx) => {
    await tx.featuredQuestion.create({
      data: {
        threadId,
        publishedQuestion: publishedQuestion.trim(),
        publishedAnswer: publishedAnswer.trim(),
        publishedImageUrl: publishedImageUrl ?? null,
        publishedBy: req.admin!.adminId,
        isVisible: isVisible ?? true,
        displayOrder: nextOrder,
      },
    })

    await tx.questionThread.update({
      where: { id: threadId },
      data: { isFeatured: true, expiresAt: null },
    })

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await tx.threadTag.createMany({
        data: tagIds.map((tagId: string) => ({ threadId, tagId })),
        skipDuplicates: true,
      })
    }
  })

  ok(res, null)
})

export default router
