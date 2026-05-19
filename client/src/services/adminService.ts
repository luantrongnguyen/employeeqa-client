import api from './api'
import type {
  Admin,
  Tag,
  QuestionThread,
  FeaturedQuestion,
  Notification,
  NotificationSummary,
  LoginPayload,
  LoginResponse,
  AdminReplyPayload,
  CreateFeaturedPayload,
  UpdateFeaturedPayload,
  CreateTagPayload,
  CreateAdminPayload,
  QuestionsFilter,
  PaginatedResponse,
  ApiResponse,
  ThreadStatus,
  UploadResponse,
} from '@/types'

export const adminService = {
  // Auth
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/admin/auth/login', payload)
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await api.post('/admin/auth/logout')
  },

  getMe: async (): Promise<Admin> => {
    const res = await api.get<ApiResponse<Admin>>('/admin/auth/me')
    return res.data.data
  },

  // Questions
  getQuestions: async (filter: QuestionsFilter): Promise<PaginatedResponse<QuestionThread>> => {
    const res = await api.get<PaginatedResponse<QuestionThread>>('/admin/questions', {
      params: filter,
    })
    return res.data
  },

  getThread: async (threadId: string): Promise<QuestionThread> => {
    const res = await api.get<ApiResponse<QuestionThread>>(`/admin/questions/${threadId}`)
    return res.data.data
  },

  updateThreadStatus: async (threadId: string, status: ThreadStatus): Promise<void> => {
    await api.patch(`/admin/questions/${threadId}/status`, { status })
  },

  replyToThread: async (threadId: string, payload: AdminReplyPayload): Promise<void> => {
    await api.post(`/admin/questions/${threadId}/messages`, payload)
  },

  assignTags: async (threadId: string, tagIds: string[]): Promise<void> => {
    await api.post(`/admin/questions/${threadId}/tags`, { tagIds })
  },

  removeTag: async (threadId: string, tagId: string): Promise<void> => {
    await api.delete(`/admin/questions/${threadId}/tags/${tagId}`)
  },

  // Featured
  getFeatured: async (): Promise<FeaturedQuestion[]> => {
    const res = await api.get<ApiResponse<FeaturedQuestion[]>>('/admin/featured')
    return res.data.data
  },

  addToFeatured: async (threadId: string, payload: CreateFeaturedPayload): Promise<void> => {
    await api.post(`/admin/questions/${threadId}/feature`, payload)
  },

  updateFeatured: async (featuredId: string, payload: UpdateFeaturedPayload): Promise<void> => {
    await api.put(`/admin/featured/${featuredId}`, payload)
  },

  removeFromFeatured: async (featuredId: string): Promise<void> => {
    await api.delete(`/admin/featured/${featuredId}`)
  },

  removeFromFeaturedByThread: async (threadId: string): Promise<void> => {
    await api.delete(`/admin/questions/${threadId}/feature`)
  },

  reorderFeatured: async (orderedIds: string[]): Promise<void> => {
    await api.put('/admin/featured/reorder', { orderedIds })
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    const res = await api.get<ApiResponse<Tag[]>>('/admin/tags')
    return res.data.data
  },

  createTag: async (payload: CreateTagPayload): Promise<Tag> => {
    const res = await api.post<ApiResponse<Tag>>('/admin/tags', payload)
    return res.data.data
  },

  updateTag: async (tagId: string, payload: Partial<CreateTagPayload>): Promise<Tag> => {
    const res = await api.put<ApiResponse<Tag>>(`/admin/tags/${tagId}`, payload)
    return res.data.data
  },

  deleteTag: async (tagId: string): Promise<void> => {
    await api.delete(`/admin/tags/${tagId}`)
  },

  // Notifications
  getNotifications: async (): Promise<NotificationSummary> => {
    const res = await api.get<ApiResponse<NotificationSummary>>('/admin/notifications')
    return res.data.data
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await api.post(`/admin/notifications/${notificationId}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/admin/notifications/read-all')
  },

  // Admin accounts
  getAccounts: async (): Promise<Admin[]> => {
    const res = await api.get<ApiResponse<Admin[]>>('/admin/accounts')
    return res.data.data
  },

  createAccount: async (payload: CreateAdminPayload): Promise<Admin> => {
    const res = await api.post<ApiResponse<Admin>>('/admin/accounts', payload)
    return res.data.data
  },

  updateAccount: async (
    adminId: string,
    payload: { displayName?: string }
  ): Promise<Admin> => {
    const res = await api.put<ApiResponse<Admin>>(`/admin/accounts/${adminId}`, payload)
    return res.data.data
  },

  changePassword: async (adminId: string, newPassword: string): Promise<void> => {
    await api.patch(`/admin/accounts/${adminId}/password`, { newPassword })
  },

  toggleActive: async (adminId: string): Promise<void> => {
    await api.patch(`/admin/accounts/${adminId}/toggle-active`)
  },

  deleteAccount: async (adminId: string): Promise<void> => {
    await api.delete(`/admin/accounts/${adminId}`)
  },

  // File upload
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await api.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}

// Dummy export to keep TS happy with unused Notification import reference
export type { Notification }
