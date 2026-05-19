import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectAdminSocket, disconnectSocket, getSocket } from '@/services/socketService'
import { useAuthStore } from '@/stores/authStore'

export function useAdminSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken) return

    connectAdminSocket(accessToken)
    const socket = getSocket()

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] })
    }

    socket.on('notification:new', handleNotification)

    return () => {
      socket.off('notification:new', handleNotification)
      disconnectSocket()
    }
  }, [accessToken])
}
