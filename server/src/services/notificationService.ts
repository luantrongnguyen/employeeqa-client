import prisma from '../db/prisma'
import type { NotificationType } from '@prisma/client'

export const createNotification = async (
  threadId: string,
  messageId: string,
  type: NotificationType
): Promise<void> => {
  await prisma.notification.create({
    data: { threadId, messageId, type },
  })
}

export const getNotificationsForAdmin = async (adminId: string) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        reads: { where: { adminId } },
        thread: {
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    }),
    prisma.notification.count({
      where: {
        reads: { none: { adminId } },
      },
    }),
  ])

  return {
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      threadId: n.threadId,
      messageId: n.messageId,
      type: n.type,
      isRead: n.reads.length > 0,
      createdAt: n.createdAt,
      threadPreview: n.thread.messages[0]?.content?.slice(0, 80) ?? '',
    })),
  }
}

export const markOneRead = async (notificationId: string, adminId: string): Promise<void> => {
  await prisma.notificationRead.upsert({
    where: { notificationId_adminId: { notificationId, adminId } },
    update: {},
    create: { notificationId, adminId },
  })
}

export const markAllRead = async (adminId: string): Promise<void> => {
  const unread = await prisma.notification.findMany({
    where: { reads: { none: { adminId } } },
    select: { id: true },
  })

  if (unread.length === 0) return

  await prisma.notificationRead.createMany({
    data: unread.map((n) => ({ notificationId: n.id, adminId })),
    skipDuplicates: true,
  })
}
