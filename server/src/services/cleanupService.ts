import prisma from '../db/prisma'
import { deleteFile } from './fileService'

export const cleanupExpiredThreads = async (): Promise<void> => {
  const expired = await prisma.questionThread.findMany({
    where: {
      isFeatured: false,
      expiresAt: { lt: new Date() },
    },
    include: {
      messages: { select: { imageUrl: true } },
    },
  })

  if (expired.length === 0) return

  for (const thread of expired) {
    for (const msg of thread.messages) {
      if (msg.imageUrl) deleteFile(msg.imageUrl)
    }
  }

  const ids = expired.map((t) => t.id)
  await prisma.questionThread.deleteMany({ where: { id: { in: ids } } })

  console.log(`[cleanup] Deleted ${ids.length} expired threads.`)
}

export const scheduleCleanup = (): void => {
  const now = new Date()
  const nextRun = new Date()
  nextRun.setHours(2, 0, 0, 0)
  if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1)

  const delay = nextRun.getTime() - now.getTime()
  setTimeout(() => {
    cleanupExpiredThreads().catch(console.error)
    setInterval(() => cleanupExpiredThreads().catch(console.error), 24 * 60 * 60 * 1000)
  }, delay)

  console.log(`[cleanup] Scheduled for ${nextRun.toLocaleString()}`)
}
