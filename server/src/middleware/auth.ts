import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type TokenPayload } from '../utils/token'
import { unauthorized } from '../utils/response'

export interface AuthRequest extends Request {
  admin?: TokenPayload
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    unauthorized(res)
    return
  }

  const token = authHeader.slice(7)
  try {
    req.admin = verifyAccessToken(token)
    next()
  } catch {
    unauthorized(res, 'Invalid or expired token')
  }
}
