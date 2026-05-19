import { Router } from 'express'
import prisma from '../../db/prisma'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import { ok, notFound, badRequest } from '../../utils/response'

const router = Router()
router.use(requireAuth)

// List featured questions
router.get('/', async (_req: AuthRequest, res) => {
  const items = await prisma.featuredQuestion.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      publisher: { select: { displayName: true } },
      thread: { include: { tags: { include: { tag: true } } } },
    },
  })

  ok(res, items.map((f) => ({
    id: f.id,
    threadId: f.threadId,
    publishedQuestion: f.publishedQuestion,
    publishedAnswer: f.publishedAnswer,
    publishedImageUrl: f.publishedImageUrl,
    publishedBy: f.publishedBy,
    publishedByName: f.publisher?.displayName ?? null,
    isVisible: f.isVisible,
    displayOrder: f.displayOrder,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    tags: f.thread.tags.map((tt) => tt.tag),
  })))
})

// Reorder — must be before /:featuredId routes to avoid conflict
router.put('/reorder', async (req: AuthRequest, res) => {
  const { orderedIds } = req.body as { orderedIds?: string[] }

  if (!Array.isArray(orderedIds)) {
    badRequest(res, 'orderedIds must be an array')
    return
  }

  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.featuredQuestion.update({ where: { id }, data: { displayOrder: index } })
    )
  )

  ok(res, null)
})

// Update featured question
router.put('/:featuredId', async (req: AuthRequest, res) => {
  const featuredId = req.params['featuredId'] as string
  const { publishedQuestion, publishedAnswer, publishedImageUrl, tagIds, isVisible, displayOrder } =
    req.body as {
      publishedQuestion?: string
      publishedAnswer?: string
      publishedImageUrl?: string
      tagIds?: string[]
      isVisible?: boolean
      displayOrder?: number
    }

  const existing = await prisma.featuredQuestion.findUnique({ where: { id: featuredId } })
  if (!existing) {
    notFound(res)
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.featuredQuestion.update({
      where: { id: featuredId },
      data: {
        ...(publishedQuestion !== undefined && { publishedQuestion: publishedQuestion.trim() }),
        ...(publishedAnswer !== undefined && { publishedAnswer: publishedAnswer.trim() }),
        ...(publishedImageUrl !== undefined && { publishedImageUrl }),
        ...(isVisible !== undefined && { isVisible }),
        ...(displayOrder !== undefined && { displayOrder }),
        publishedBy: req.admin!.adminId,
      },
    })

    if (Array.isArray(tagIds)) {
      await tx.threadTag.deleteMany({ where: { threadId: existing.threadId } })
      if (tagIds.length > 0) {
        await tx.threadTag.createMany({
          data: tagIds.map((tagId: string) => ({ threadId: existing.threadId, tagId })),
          skipDuplicates: true,
        })
      }
    }
  })

  ok(res, null)
})

// Remove from featured
router.delete('/:featuredId', async (req: AuthRequest, res) => {
  const featuredId = req.params['featuredId'] as string

  const existing = await prisma.featuredQuestion.findUnique({ where: { id: featuredId } })
  if (!existing) {
    notFound(res)
    return
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.$transaction([
    prisma.featuredQuestion.delete({ where: { id: featuredId } }),
    prisma.questionThread.update({
      where: { id: existing.threadId },
      data: { isFeatured: false, expiresAt },
    }),
  ])

  ok(res, null)
})

export default router
