import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const res = await axios.post(`${API_BASE}/admin/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = res.data
        useAuthStore.getState().setAuth(useAuthStore.getState().admin!, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
