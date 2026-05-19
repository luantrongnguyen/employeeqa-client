import { useRef, useState } from 'react'
import { Box, Button, IconButton, Typography, CircularProgress } from '@mui/material'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { validateImage, createPreviewUrl, revokePreviewUrl } from '@/utils/image'

interface Props {
  onUpload: (file: File) => Promise<string>
  onClear: () => void
  uploadedUrl: string | null
  disabled?: boolean
}

export default function ImageUpload({ onUpload, onClear, uploadedUrl, disabled }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImage(file)
    if (validationError) {
      setError(t(`employee.${validationError}`))
      return
    }

    setError(null)
    const url = createPreviewUrl(file)
    setPreview(url)
    setLoading(true)

    try {
      await onUpload(file)
    } catch {
      setError(t('common.error'))
      revokePreviewUrl(url)
      setPreview(null)
    } finally {
      setLoading(false)
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClear = () => {
    if (preview) {
      revokePreviewUrl(preview)
      setPreview(null)
    }
    setError(null)
    onClear()
  }

  const displayUrl = uploadedUrl || preview

  return (
    <Box>
      {displayUrl ? (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Box
            component="img"
            src={displayUrl}
            alt="attachment"
            sx={{ maxHeight: 200, maxWidth: '100%', borderRadius: 2, display: 'block' }}
          />
          {loading && (
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2,
            }}>
              <CircularProgress size={32} />
            </Box>
          )}
          {!loading && (
            <IconButton
              size="small"
              onClick={handleClear}
              disabled={disabled}
              sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<PhotoCamera />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || loading}
        >
          {t('employee.attachImage')}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && (
        <Typography variant="caption" color="error" display="block" mt={0.5}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
