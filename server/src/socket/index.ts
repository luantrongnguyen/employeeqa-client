import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { verifyAccessToken } from '../utils/token'
import prisma from '../db/prisma'

let io: SocketIOServer | null = null

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  const allowedOrigins = new Set(
    (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim())
  )

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.has(origin)) return callback(null, true)
        if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin)) return callback(null, true)
        callback(new Error('CORS not allowed'))
      },
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    // Admin authenticates with JWT access token
    socket.on('auth:admin', (token: string) => {
      try {
        const payload = verifyAccessToken(token)
        socket.data.adminId = payload.adminId
        socket.join('room:admin')
      } catch {
        // invalid/expired token — ignore
      }
    })

    // Join a thread room
    // Admin sends: { threadId }
    // Employee sends: { accessToken }
    socket.on('thread:join', async (data: { threadId?: string; accessToken?: string }) => {
      if (data.threadId) {
        socket.join(`thread:${data.threadId}`)
      } else if (data.accessToken) {
        const thread = await prisma.questionThread.findUnique({
          where: { accessToken: data.accessToken },
          select: { id: true },
        })
        if (thread) {
          socket.join(`thread:${thread.id}`)
        }
      }
    })
  })

  return io
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}
