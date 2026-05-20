export interface Admin {
  id: string
  username: string
  displayName: string
  isActive: boolean
  createdAt: string
}

export interface Tag {
  id: string
  nameVi: string
  nameEn: string
  color: string
}

export type ThreadStatus = 'open' | 'answered' | 'hidden' | 'closed'

export interface QuestionThread {
  id: string
  accessToken: string
  status: ThreadStatus
  isFeatured: boolean
  expiresAt: string | null
  tags: Tag[]
  messages: Message[]
  messageCount: number
  createdAt: string
  updatedAt: string
}

export type SenderType = 'employee' | 'admin'

export interface Message {
  id: string
  threadId: string
  senderType: SenderType
  adminId: string | null
  adminDisplayName: string | null
  content: string
  imageUrl: string | null
  imageOriginalName: string | null
  isHidden: boolean
  createdAt: string
}

export interface FeaturedQuestion {
  id: string
  threadId: string
  publishedQuestion: string
  publishedAnswer: string
  publishedImageUrl: string | null
  publishedBy: string | null
  publishedByName: string | null
  isVisible: boolean
  displayOrder: number
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export type NotificationType = 'new_question' | 'new_reply'

export interface Notification {
  id: string
  threadId: string
  messageId: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  threadPreview: string
}

export interface NotificationSummary {
  unreadCount: number
  notifications: Notification[]
}

// API response wrappers
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Request payloads
export interface CreateQuestionPayload {
  content: string
  imageUrl?: string
  tagIds: string[]
}

export interface CreateMessagePayload {
  content: string
  imageUrl?: string
}

export interface AdminReplyPayload {
  content: string
  imageUrl?: string
}

export interface CreateFeaturedPayload {
  publishedQuestion: string
  publishedAnswer: string
  publishedImageUrl?: string
  tagIds: string[]
  isVisible: boolean
}

export interface UpdateFeaturedPayload {
  publishedQuestion?: string
  publishedAnswer?: string
  publishedImageUrl?: string
  tagIds?: string[]
  isVisible?: boolean
  displayOrder?: number
}

export interface LoginPayload {
  username: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  admin: Admin
}

export interface CreateTagPayload {
  nameVi: string
  nameEn: string
  color: string
}

export interface CreateAdminPayload {
  username: string
  displayName: string
  password: string
}

export interface QuestionsFilter {
  date?: string
  status?: ThreadStatus | 'all'
  tagIds?: string[]
  keyword?: string
  page?: number
  pageSize?: number
}

export interface UploadResponse {
  url: string
  originalName: string
  sizeBytes: number
}
