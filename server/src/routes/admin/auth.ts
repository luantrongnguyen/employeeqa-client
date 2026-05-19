import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../../db/prisma'
import { requireAuth, type AuthRequest } from '../../middleware/auth'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/token'
import { ok, unauthorized, badRequest } from '../../utils/response'

const router = Router()

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    badRequest(res, 'username and password are required')
    return
  }

  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin || !admin.isActive) {
    unauthorized(res, 'Invalid credentials')
    return
  }

  const match = await bcrypt.compare(password, admin.passwordHash)
  if (!match) {
    unauthorized(res, 'Invalid credentials')
    return
  }

  const payload = { adminId: admin.id, username: admin.username }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS)
  ok(res, {
    accessToken,
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    },
  })
})

router.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE)
  ok(res, null)
})

router.post('/refresh', (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) {
    unauthorized(res)
    return
  }

  try {
    const payload = verifyRefreshToken(token)
    const accessToken = signAccessToken({ adminId: payload.adminId, username: payload.username })
    ok(res, { accessToken })
  } catch {
    res.clearCookie(REFRESH_COOKIE)
    unauthorized(res, 'Invalid refresh token')
  }
})

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin!.adminId },
    select: { id: true, username: true, displayName: true, isActive: true, createdAt: true },
  })
  if (!admin) {
    unauthorized(res)
    return
  }
  ok(res, admin)
})

export default router
