import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL ?? ''

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true, autoConnect: false })
  }
  return socket
}

export function connectAdminSocket(token: string): void {
  const s = getSocket()
  if (!s.connected) s.connect()
  s.emit('auth:admin', token)
}

export function connectEmployeeSocket(): void {
  const s = getSocket()
  if (!s.connected) s.connect()
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
