import { Router } from 'express'
import { upload, buildImageUrl } from '../services/fileService'
import { created, badRequest } from '../utils/response'
import type { Request } from 'express'

const router = Router()

router.post('/image', (req: Request, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.message === 'Invalid file type') {
        badRequest(res, 'Only JPG, PNG, GIF, WEBP images are allowed')
        return
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        badRequest(res, 'Image must not exceed 5MB')
        return
      }
      next(err)
      return
    }

    if (!req.file) {
      badRequest(res, 'No image file provided')
      return
    }

    const url = buildImageUrl(null, req.file.filename)
    created(res, {
      url,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
    })
  })
})

export default router
