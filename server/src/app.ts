import 'dotenv/config'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import { errorHandler } from './middleware/errorHandler'
import { scheduleCleanup } from './services/cleanupService'
import { initSocket } from './socket'

import employeeRoutes from './routes/employee'
import uploadRoutes from './routes/upload'
import authRoutes from './routes/admin/auth'
import questionsRoutes from './routes/admin/questions'
import featuredRoutes from './routes/admin/featured'
import tagsRoutes from './routes/admin/tags'
import notificationsRoutes from './routes/admin/notifications'
import accountsRoutes from './routes/admin/accounts'

const app = express()
const PORT = parseInt(process.env.PORT ?? '5000')

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
const ALLOWED_ORIGINS = new Set(
  (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim())
)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true)
    if (/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true)
    callback(new Error('CORS not allowed'))
  },
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Static uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads'
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)))

// Public routes (employee)
app.use('/api', employeeRoutes)
app.use('/api/upload', uploadRoutes)

// Admin routes
app.use('/api/admin/auth', authRoutes)
app.use('/api/admin/questions', questionsRoutes)
app.use('/api/admin/featured', featuredRoutes)
app.use('/api/admin/tags', tagsRoutes)
app.use('/api/admin/notifications', notificationsRoutes)
app.use('/api/admin/accounts', accountsRoutes)

// Error handler
app.use(errorHandler)

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  scheduleCleanup()
})

export default app
