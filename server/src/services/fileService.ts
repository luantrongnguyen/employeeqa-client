import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads'
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '5242880')
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = crypto.randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})

export const deleteFile = (imageUrl: string): void => {
  try {
    const filename = path.basename(imageUrl)
    const filepath = path.join(UPLOAD_DIR, filename)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
  } catch {
    // silently ignore file deletion errors
  }
}

export const buildImageUrl = (_req: unknown, filename: string): string => {
  return `/uploads/${filename}`
}
