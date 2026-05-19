import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../../db/prisma'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import { ok, created, notFound, badRequest, conflict, forbidden } from '../../utils/response'

const router = Router()
router.use(requireAuth)

const safeAdmin = (a: {
  id: string; username: string; displayName: string; isActive: boolean; createdAt: Date
}) => ({ id: a.id, username: a.username, displayName: a.displayName, isActive: a.isActive, createdAt: a.createdAt })

router.get('/', async (_req: AuthRequest, res) => {
  const accounts = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, displayName: true, isActive: true, createdAt: true },
  })
  ok(res, accounts.map(safeAdmin))
})

router.post('/', async (req: AuthRequest, res) => {
  const { username, displayName, password } = req.body as {
    username?: string; displayName?: string; password?: string
  }

  if (!username?.trim() || !displayName?.trim() || !password) {
    badRequest(res, 'username, displayName and password are required')
    return
  }
  if (password.length < 6) {
    badRequest(res, 'password must be at least 6 characters')
    return
  }

  const existing = await prisma.admin.findUnique({ where: { username: username.trim() } })
  if (existing) {
    conflict(res, 'Username already taken')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await prisma.admin.create({
    data: { username: username.trim(), displayName: displayName.trim(), passwordHash },
  })

  created(res, safeAdmin(admin))
})

router.put('/:adminId', async (req: AuthRequest, res) => {
  const adminId = req.params['adminId'] as string
  const { displayName } = req.body as { displayName?: string }

  const existing = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!existing) { notFound(res); return }

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: { ...(displayName !== undefined && { displayName: displayName.trim() }) },
  })

  ok(res, safeAdmin(admin))
})

router.patch('/:adminId/password', async (req: AuthRequest, res) => {
  const adminId = req.params['adminId'] as string
  const { newPassword } = req.body as { newPassword?: string }

  if (!newPassword || newPassword.length < 6) {
    badRequest(res, 'newPassword must be at least 6 characters')
    return
  }

  const existing = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!existing) { notFound(res); return }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.admin.update({ where: { id: adminId }, data: { passwordHash } })
  ok(res, null)
})

router.patch('/:adminId/toggle-active', async (req: AuthRequest, res) => {
  const adminId = req.params['adminId'] as string

  if (adminId === req.admin!.adminId) {
    forbidden(res, 'Cannot deactivate your own account')
    return
  }

  const existing = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!existing) { notFound(res); return }

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: { isActive: !existing.isActive },
  })

  ok(res, safeAdmin(admin))
})

router.delete('/:adminId', async (req: AuthRequest, res) => {
  const adminId = req.params['adminId'] as string

  if (adminId === req.admin!.adminId) {
    forbidden(res, 'Cannot delete your own account')
    return
  }

  const existing = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!existing) { notFound(res); return }

  await prisma.admin.delete({ where: { id: adminId } })
  ok(res, null)
})

export default router
