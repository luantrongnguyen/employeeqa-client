import { Router } from 'express'
import prisma from '../../db/prisma'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import { ok, created, notFound, badRequest } from '../../utils/response'

const router = Router()
router.use(requireAuth)

router.get('/', async (_req: AuthRequest, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { nameVi: 'asc' } })
  ok(res, tags)
})

router.post('/', async (req: AuthRequest, res) => {
  const { nameVi, nameEn, color } = req.body as {
    nameVi?: string; nameEn?: string; color?: string
  }

  if (!nameVi?.trim() || !nameEn?.trim()) {
    badRequest(res, 'nameVi and nameEn are required')
    return
  }

  const tag = await prisma.tag.create({
    data: { nameVi: nameVi.trim(), nameEn: nameEn.trim(), color: color ?? '#6B7280' },
  })

  created(res, tag)
})

router.put('/:tagId', async (req: AuthRequest, res) => {
  const tagId = req.params['tagId'] as string
  const { nameVi, nameEn, color } = req.body as {
    nameVi?: string; nameEn?: string; color?: string
  }

  const existing = await prisma.tag.findUnique({ where: { id: tagId } })
  if (!existing) {
    notFound(res)
    return
  }

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: {
      ...(nameVi !== undefined && { nameVi: nameVi.trim() }),
      ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
      ...(color !== undefined && { color }),
    },
  })

  ok(res, tag)
})

router.delete('/:tagId', async (req: AuthRequest, res) => {
  const tagId = req.params['tagId'] as string

  const existing = await prisma.tag.findUnique({ where: { id: tagId } })
  if (!existing) {
    notFound(res)
    return
  }

  await prisma.tag.delete({ where: { id: tagId } })
  ok(res, null)
})

export default router
