import { useState } from 'react'
import {
  Box, Paper, Typography, Stack, Chip, Button, TextField,
  IconButton, Avatar, CircularProgress, Alert,
  Menu, MenuItem, Divider, useTheme, useMediaQuery,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import SendIcon from '@mui/icons-material/Send'
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/services/socketService'
import { useForm } from 'react-hook-form'
import { adminService } from '@/services/adminService'
import TagChip from '@/components/shared/TagChip'
import ImageUpload from '@/components/shared/ImageUpload'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FeaturedFormDialog from '@/components/admin/FeaturedFormDialog'
import TagAssignDialog from '@/components/admin/TagAssignDialog'
import { fromNow } from '@/utils/date'
import { useAuthStore } from '@/stores/authStore'
import type { Message, ThreadStatus } from '@/types'

interface FormValues {
  content: string
}

const STATUS_COLOR: Record<ThreadStatus, 'warning' | 'success' | 'default' | 'error'> = {
  open: 'warning',
  answered: 'success',
  hidden: 'error',
  closed: 'default',
}

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { t, i18n } = useTranslation()
  usePageTitle('admin.questions.title')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' })
  const [featuredOpen, setFeaturedOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const { data: thread, isLoading } = useQuery({
    queryKey: ['admin-thread', threadId],
    queryFn: () => adminService.getThread(threadId!),
    enabled: !!threadId,
  })

  useEffect(() => {
    if (!threadId) return
    const socket = getSocket()
    socket.emit('thread:join', { threadId })

    const handleMessage = (message: Message) => {
      queryClient.setQueryData<typeof thread>(['admin-thread', threadId], (old) => {
        if (!old) return old
        if (old.messages.some(m => m.id === message.id)) return old
        return { ...old, messages: [...old.messages, message] }
      })
    }

    socket.on('message:new', handleMessage)
    return () => { socket.off('message:new', handleMessage) }
  }, [threadId])

  const replyMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrl?: string }) =>
      adminService.replyToThread(threadId!, payload),
    onSuccess: () => {
      reset()
      setImageUrl(null)
      queryClient.invalidateQueries({ queryKey: ['admin-thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: ThreadStatus) => adminService.updateThreadStatus(threadId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] })
    },
  })

  const removeFeatureMutation = useMutation({
    mutationFn: () => adminService.removeFromFeaturedByThread(threadId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thread', threadId] })
    },
  })

  const handleUpload = async (file: File): Promise<string> => {
    const res = await adminService.uploadImage(file)
    setImageUrl(res.url)
    return res.url
  }

  const onSubmit = (values: FormValues) => {
    replyMutation.mutate({ content: values.content, imageUrl: imageUrl ?? undefined })
  }

  const handleConfirm = () => {
    const { action } = confirmDialog
    setConfirmDialog({ open: false, action: '' })
    setMenuAnchor(null)
    if (action === 'hide') statusMutation.mutate('hidden')
    if (action === 'show') statusMutation.mutate(thread?.status === 'hidden' ? 'open' : (thread?.status ?? 'open'))
    if (action === 'close') statusMutation.mutate('closed')
    if (action === 'open') statusMutation.mutate('open')
    if (action === 'removeFeature') removeFeatureMutation.mutate()
  }

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (!thread) return null

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={3} spacing={1}>
        <IconButton onClick={() => navigate('/admin/questions')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          {t('admin.questions.title')}
        </Typography>
        {isMobile ? (
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => setTagDialogOpen(true)}>
              {t('admin.thread.assignTags')}
            </Button>
            {thread.isFeatured ? (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={<StarIcon />}
                onClick={() => setConfirmDialog({ open: true, action: 'removeFeature' })}
              >
                {t('admin.thread.removeFromFeatured')}
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                color="success"
                startIcon={<StarBorderIcon />}
                onClick={() => setFeaturedOpen(true)}
              >
                {t('admin.thread.addToFeatured')}
              </Button>
            )}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap">
        <Chip
          label={t(`admin.questions.status_${thread.status}`)}
          color={STATUS_COLOR[thread.status]}
          size="small"
        />
        {thread.tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
        {thread.isFeatured && (
          <Chip icon={<StarIcon sx={{ fontSize: 14 }} />} label={t('admin.questions.featured')} size="small" color="warning" />
        )}
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          {thread.messages.map((msg) => (
            <AdminMessageBubble
              key={msg.id}
              message={msg}
              lang={i18n.language}
              t={t}
              currentAdminId={admin?.id ?? ''}
            />
          ))}
        </Stack>
      </Paper>

      {thread.status !== 'closed' && thread.status !== 'hidden' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('admin.thread.reply')}
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder={t('admin.thread.replyPlaceholder')}
              {...register('content', { required: t('common.required') })}
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
              <Alert severity="error" sx={{ mt: 1 }}>{t('common.error')}</Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={replyMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={replyMutation.isPending}
              sx={{ mt: 2 }}
            >
              {t('admin.thread.sendReply')}
            </Button>
          </Box>
        </Paper>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {isMobile && (
          <MenuItem onClick={() => { setMenuAnchor(null); setTagDialogOpen(true) }}>
            {t('admin.thread.assignTags')}
          </MenuItem>
        )}
        {isMobile && thread.isFeatured && (
          <MenuItem onClick={() => { setMenuAnchor(null); setConfirmDialog({ open: true, action: 'removeFeature' }) }}>
            {t('admin.thread.removeFromFeatured')}
          </MenuItem>
        )}
        {isMobile && !thread.isFeatured && (
          <MenuItem onClick={() => { setMenuAnchor(null); setFeaturedOpen(true) }}>
            {t('admin.thread.addToFeatured')}
          </MenuItem>
        )}
        {isMobile && <Divider />}
        {thread.status !== 'hidden' && (
          <MenuItem onClick={() => setConfirmDialog({ open: true, action: 'hide' })}>
            {t('admin.thread.hideThread')}
          </MenuItem>
        )}
        {thread.status === 'hidden' && (
          <MenuItem onClick={() => setConfirmDialog({ open: true, action: 'show' })}>
            {t('admin.thread.showThread')}
          </MenuItem>
        )}
        {thread.status !== 'closed' && thread.status !== 'hidden' && (
          <MenuItem onClick={() => setConfirmDialog({ open: true, action: 'close' })}>
            {t('admin.thread.closeThread')}
          </MenuItem>
        )}
        {thread.status === 'closed' && (
          <MenuItem onClick={() => statusMutation.mutate('open')}>
            {t('admin.thread.reopenThread')}
          </MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={confirmDialog.open}
        title={t('common.confirm')}
        content={
          confirmDialog.action === 'hide'
            ? t('admin.thread.hideConfirm')
            : confirmDialog.action === 'close'
            ? t('admin.thread.closeConfirm')
            : confirmDialog.action === 'removeFeature'
            ? t('admin.thread.removeFeatureConfirm')
            : ''
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ open: false, action: '' })}
      />

      <FeaturedFormDialog
        open={featuredOpen}
        thread={thread}
        onClose={() => setFeaturedOpen(false)}
        onSuccess={() => {
          setFeaturedOpen(false)
          queryClient.invalidateQueries({ queryKey: ['admin-thread', threadId] })
        }}
      />

      <TagAssignDialog
        open={tagDialogOpen}
        thread={thread}
        onClose={() => setTagDialogOpen(false)}
        onSuccess={() => {
          setTagDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['admin-thread', threadId] })
        }}
      />
    </Box>
  )
}

function AdminMessageBubble({
  message,
  lang,
  t,
  currentAdminId,
}: {
  message: Message
  lang: string
  t: (key: string) => string
  currentAdminId: string
}) {
  const isAdmin = message.senderType === 'admin'
  const isMe = message.adminId === currentAdminId

  return (
    <Box sx={{ display: 'flex', flexDirection: isAdmin ? 'row-reverse' : 'row', gap: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, flexShrink: 0, bgcolor: isAdmin ? 'primary.main' : 'grey.400', fontSize: 13 }}>
        {isAdmin ? (message.adminDisplayName?.[0] ?? 'A') : 'E'}
      </Avatar>
      <Box sx={{ maxWidth: '75%' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}
          sx={{ textAlign: isAdmin ? 'right' : 'left' }}>
          {isAdmin
            ? `${message.adminDisplayName ?? t('thread.admin')}${isMe ? ' (you)' : ''}`
            : t('thread.you')}
          {' · '}{fromNow(message.createdAt, lang)}
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
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
          {message.imageUrl && (
            <Box component="img" src={message.imageUrl} alt="" sx={{ mt: 1, maxHeight: 200, borderRadius: 1, maxWidth: '100%', display: 'block' }} />
          )}
        </Paper>
      </Box>
    </Box>
  )
}
