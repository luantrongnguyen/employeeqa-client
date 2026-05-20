import { useState } from 'react'
import {
  Box, Paper, Typography, TextField, Button, Alert, Snackbar,
  Stack, CircularProgress, Chip,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LabelIcon from '@mui/icons-material/Label'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '@/services/employeeService'
import ImageUpload from '@/components/shared/ImageUpload'

interface FormValues {
  content: string
}

export default function HomePage() {
  const { t, i18n } = useTranslation()
  usePageTitle('employee.title')
  const navigate = useNavigate()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagError, setTagError] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copySnack, setCopySnack] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const { data: tags = [] } = useQuery({
    queryKey: ['tags-public'],
    queryFn: employeeService.getTags,
  })

  const submitMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrl?: string; tagIds: string[] }) =>
      employeeService.createQuestion(payload),
    onSuccess: (data) => {
      setGeneratedToken(data.accessToken)
      reset()
      setImageUrl(null)
      setSelectedTagIds([])
      setTagError(false)
    },
  })

  const handleUpload = async (file: File): Promise<string> => {
    const res = await employeeService.uploadImage(file)
    setImageUrl(res.url)
    return res.url
  }

  const toggleTag = (id: string) => {
    setTagError(false)
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const onSubmit = (values: FormValues) => {
    if (selectedTagIds.length === 0) {
      setTagError(true)
      return
    }
    submitMutation.mutate({ content: values.content, imageUrl: imageUrl ?? undefined, tagIds: selectedTagIds })
  }

  const threadUrl = generatedToken
    ? `${window.location.origin}/q/${generatedToken}`
    : null

  const handleCopy = () => {
    if (!threadUrl) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(threadUrl).then(() => setCopySnack(true)).catch(() => fallbackCopy(threadUrl))
    } else {
      fallbackCopy(threadUrl)
    }
  }

  const fallbackCopy = (text: string) => {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    try {
      document.execCommand('copy')
      setCopySnack(true)
    } finally {
      document.body.removeChild(el)
    }
  }

  const handleAskAnother = () => {
    setGeneratedToken(null)
    setImageUrl(null)
  }

  const isVi = i18n.language === 'vi'

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t('employee.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {t('employee.subtitle')}
        </Typography>

        {!generatedToken ? (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={t('employee.questionLabel')}
              placeholder={t('employee.questionPlaceholder')}
              {...register('content', {
                required: t('common.required'),
                minLength: { value: 10, message: t('employee.questionMinLength') },
              })}
              error={!!errors.content}
              helperText={errors.content?.message}
              sx={{ mb: 3 }}
            />

            {/* Tag selection */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                <LabelIcon sx={{ fontSize: 18, color: tagError ? 'error.main' : 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} color={tagError ? 'error.main' : 'text.primary'}>
                  {t('employee.selectTopic')}
                  <Typography component="span" color="error.main" ml={0.3}>*</Typography>
                </Typography>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <Chip
                      key={tag.id}
                      label={isVi ? tag.nameVi : tag.nameEn}
                      onClick={() => toggleTag(tag.id)}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        borderColor: tag.color,
                        color: selected ? 'white' : tag.color,
                        bgcolor: selected ? tag.color : 'transparent',
                        fontWeight: selected ? 600 : 400,
                        '&:hover': { bgcolor: selected ? tag.color : `${tag.color}18` },
                      }}
                    />
                  )
                })}
              </Box>
              {tagError && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                  {t('employee.tagRequired')}
                </Typography>
              )}
            </Box>

            <ImageUpload
              onUpload={handleUpload}
              onClear={() => setImageUrl(null)}
              uploadedUrl={imageUrl}
              disabled={submitMutation.isPending}
            />

            {submitMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {t('common.error')}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={submitMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={submitMutation.isPending}
              sx={{ mt: 3 }}
            >
              {t('employee.submitQuestion')}
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography fontWeight={600}>{t('employee.successTitle')}</Typography>
              <Typography variant="body2">{t('employee.successDesc')}</Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('employee.linkWarning')}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              {t('employee.yourLink')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 14 }}>
              {threadUrl}
            </Paper>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                {t('common.copy')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/q/${generatedToken}`)}
              >
                {t('employee.goToThread')}
              </Button>
              <Button variant="text" onClick={handleAskAnother}>
                {t('employee.askAnother')}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={copySnack}
        autoHideDuration={2000}
        onClose={() => setCopySnack(false)}
        message={t('common.copied')}
      />
    </Box>
  )
}
