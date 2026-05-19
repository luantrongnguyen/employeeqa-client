import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Stack, Chip, Alert, Button,
  TextField, CircularProgress, Avatar,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import HomeIcon from '@mui/icons-material/Home'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { employeeService } from '@/services/employeeService'
import { connectEmployeeSocket, disconnectSocket, getSocket } from '@/services/socketService'
import ImageUpload from '@/components/shared/ImageUpload'
import { fromNow, daysUntil, isExpired } from '@/utils/date'
import type { Message } from '@/types'

interface FormValues {
  content: string
}

const STATUS_COLOR = {
  open: 'warning',
  answered: 'success',
  closed: 'default',
  hidden: 'error',
} as const

export default function ThreadPage() {
  const { accessToken } = useParams<{ accessToken: string }>()
  const { t, i18n } = useTranslation()
  usePageTitle('thread.title')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const { data: thread, isLoading, isError, error } = useQuery({
    queryKey: ['thread', accessToken],
    queryFn: () => employeeService.getThread(accessToken!),
    enabled: !!accessToken,
    retry: false,
  })

  useEffect(() => {
    if (!accessToken) return
    connectEmployeeSocket()
    const socket = getSocket()
    socket.emit('thread:join', { accessToken })

    const handleMessage = (message: Message) => {
      queryClient.setQueryData<typeof thread>(['thread', accessToken], (old) => {
        if (!old) return old
        if (old.messages.some(m => m.id === message.id)) return old
        return { ...old, messages: [...old.messages, message] }
      })
    }

    const handleStatus = ({ status }: { status: string }) => {
      queryClient.setQueryData<typeof thread>(['thread', accessToken], (old) => {
        if (!old) return old
        return { ...old, status: status as typeof old.status }
      })
    }

    socket.on('message:new', handleMessage)
    socket.on('thread:status', handleStatus)

    return () => {
      socket.off('message:new', handleMessage)
      socket.off('thread:status', handleStatus)
      disconnectSocket()
    }
  }, [accessToken])

  const replyMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrl?: string }) =>
      employeeService.sendReply(accessToken!, payload),
    onSuccess: () => {
      reset()
      setImageUrl(null)
      queryClient.invalidateQueries({ queryKey: ['thread', accessToken] })
    },
  })

  const onSubmit = (values: FormValues) => {
    replyMutation.mutate({ content: values.content, imageUrl: imageUrl ?? undefined })
  }

  const handleUpload = async (file: File): Promise<string> => {
    const res = await employeeService.uploadImage(file)
    setImageUrl(res.url)
    return res.url
  }

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const httpStatus = (error as { response?: { status: number } })?.response?.status
  const isNotFound = isError && httpStatus === 404
  const isExpiredError = isError && httpStatus === 410
  const isExpiredThread = isExpiredError || (thread && isExpired(thread.expiresAt))

  if (isNotFound) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>{t('thread.notFound')}</Typography>
        <Typography color="text.secondary" mb={3}>{t('thread.notFoundDesc')}</Typography>
        <Button startIcon={<HomeIcon />} variant="outlined" onClick={() => navigate('/')}>
          {t('thread.backToHome')}
        </Button>
      </Paper>
    )
  }

  if (isExpiredThread) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>{t('thread.expired')}</Typography>
        <Typography color="text.secondary" mb={3}>{t('thread.expiredDesc')}</Typography>
        <Button startIcon={<HomeIcon />} variant="outlined" onClick={() => navigate('/')}>
          {t('thread.backToHome')}
        </Button>
      </Paper>
    )
  }

  if (!thread) return null

  const canReply = thread.status !== 'closed' && thread.status !== 'hidden'
  const daysLeft = thread.expiresAt ? daysUntil(thread.expiresAt) : null

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            {t('thread.title')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={t(`thread.status_${thread.status}`)}
              color={STATUS_COLOR[thread.status]}
              size="small"
            />
            {daysLeft !== null && daysLeft > 0 && (
              <Chip
                label={t('thread.expiresSoon', { days: daysLeft })}
                size="small"
                variant="outlined"
                color={daysLeft <= 3 ? 'warning' : 'default'}
              />
            )}
          </Stack>
        </Stack>

        <Stack spacing={2}>
          {thread.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} lang={i18n.language} t={t} />
          ))}
        </Stack>
      </Paper>

      {!canReply && (
        <Alert severity="info">{t('thread.closedMessage')}</Alert>
      )}

      {canReply && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('thread.replyPlaceholder')}
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder={t('thread.replyPlaceholder')}
              {...register('content', {
                required: t('common.required'),
                minLength: { value: 5, message: t('employee.questionMinLength') },
              })}
              error={!!errors.content}
              helperText={errors.content?.message}
              sx={{ mb: 2 }}
            />

            <ImageUpload
              onUpload={handleUpload}
              onClear={() => setImageUrl(null)}
              uploadedUrl={imageUrl}
              disabled={replyMutation.isPending}
            />

            {replyMutation.isError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {t('common.error')}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              startIcon={replyMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={replyMutation.isPending}
              sx={{ mt: 2 }}
            >
              {t('thread.sendReply')}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  )
}

function MessageBubble({
  message,
  lang,
  t,
}: {
  message: Message
  lang: string
  t: (key: string) => string
}) {
  const isAdmin = message.senderType === 'admin'

  return (
    <Box sx={{ display: 'flex', flexDirection: isAdmin ? 'row-reverse' : 'row', gap: 1.5 }}>
      <Avatar
        sx={{
          width: 32, height: 32, flexShrink: 0,
          bgcolor: isAdmin ? 'primary.main' : 'grey.300',
          fontSize: 13,
        }}
      >
        {isAdmin ? 'A' : 'E'}
      </Avatar>
      <Box sx={{ maxWidth: '80%' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}
          sx={{ textAlign: isAdmin ? 'right' : 'left' }}>
          {isAdmin ? (message.adminDisplayName || t('thread.admin')) : t('thread.you')}
          {' · '}
          {fromNow(message.createdAt, lang)}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: isAdmin ? 'primary.50' : 'grey.100',
            border: '1px solid',
            borderColor: isAdmin ? 'primary.100' : 'grey.200',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          {message.imageUrl && (
            <Box
              component="img"
              src={message.imageUrl}
              alt=""
              sx={{ mt: 1, maxHeight: 200, borderRadius: 1, maxWidth: '100%', display: 'block' }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  )
}
