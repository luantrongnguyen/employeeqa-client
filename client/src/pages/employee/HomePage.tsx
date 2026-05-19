import { useState } from 'react'
import {
  Box, Paper, Typography, TextField, Button, Alert, Snackbar,
  Divider, Stack, CircularProgress,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '@/services/employeeService'
import ImageUpload from '@/components/shared/ImageUpload'
import FeaturedList from '@/components/employee/FeaturedList'

interface FormValues {
  content: string
}

export default function HomePage() {
  const { t } = useTranslation()
  usePageTitle('employee.title')
  const navigate = useNavigate()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copySnack, setCopySnack] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const { data: featured } = useQuery({
    queryKey: ['featured-public'],
    queryFn: employeeService.getFeatured,
  })

  const submitMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrl?: string }) =>
      employeeService.createQuestion(payload),
    onSuccess: (data) => {
      setGeneratedToken(data.accessToken)
      reset()
      setImageUrl(null)
    },
  })

  const handleUpload = async (file: File): Promise<string> => {
    const res = await employeeService.uploadImage(file)
    setImageUrl(res.url)
    return res.url
  }

  const onSubmit = (values: FormValues) => {
    submitMutation.mutate({ content: values.content, imageUrl: imageUrl ?? undefined })
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
              sx={{ mb: 2 }}
            />

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

      {featured && featured.length > 0 && (
        <>
          <Divider sx={{ mb: 4 }} />
          <FeaturedList items={featured} />
        </>
      )}

      <Snackbar
        open={copySnack}
        autoHideDuration={2000}
        onClose={() => setCopySnack(false)}
        message={t('common.copied')}
      />
    </Box>
  )
}
