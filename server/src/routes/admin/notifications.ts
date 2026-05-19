import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import {
  getNotificationsForAdmin,
  markOneRead,
  markAllRead,
} from '../../services/notificationService'
import { ok, notFound } from '../../utils/response'
import prisma from '../../db/prisma'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  const summary = await getNotificationsForAdmin(req.admin!.adminId)
  ok(res, summary)
})

router.post('/read-all', async (req: AuthRequest, res) => {
  await markAllRead(req.admin!.adminId)
  ok(res, null)
})

router.post('/:notificationId/read', async (req: AuthRequest, res) => {
  const notificationId = req.params['notificationId'] as string

  const exists = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!exists) {
    notFound(res)
    return
  }

  await markOneRead(notificationId, req.admin!.adminId)
  ok(res, null)
})

export default router
