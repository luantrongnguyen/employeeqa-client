import api from './api'
import type {
  QuestionThread,
  FeaturedQuestion,
  Tag,
  CreateQuestionPayload,
  CreateMessagePayload,
  UploadResponse,
  ApiResponse,
} from '@/types'

export const employeeService = {
  createQuestion: async (payload: CreateQuestionPayload): Promise<{ accessToken: string }> => {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/questions', payload)
    return res.data.data
  },

  getThread: async (accessToken: string): Promise<QuestionThread> => {
    const res = await api.get<ApiResponse<QuestionThread>>(`/questions/${accessToken}`)
    return res.data.data
  },

  sendReply: async (accessToken: string, payload: CreateMessagePayload): Promise<void> => {
    await api.post(`/questions/${accessToken}/messages`, payload)
  },

  getFeatured: async (): Promise<FeaturedQuestion[]> => {
    const res = await api.get<ApiResponse<FeaturedQuestion[]>>('/featured')
    return res.data.data
  },

  getTags: async (): Promise<Tag[]> => {
    const res = await api.get<ApiResponse<Tag[]>>('/tags')
    return res.data.data
  },

  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await api.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}
