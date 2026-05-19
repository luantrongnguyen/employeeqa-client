import { useState } from 'react'
import {
  Box, Typography, Paper, Stack, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Chip, useTheme, useMediaQuery,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminService } from '@/services/adminService'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import type { Tag, CreateTagPayload } from '@/types'

const PRESET_COLORS = [
  '#1976d2', '#388e3c', '#d32f2f', '#f57c00',
  '#7b1fa2', '#0288d1', '#00796b', '#c62828',
]

interface FormValues {
  nameVi: string
  nameEn: string
  color: string
}

export default function TagsPage() {
  const { t } = useTranslation()
  usePageTitle('admin.tags.title')
  const queryClient = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTag, setEditTag] = useState<Tag | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: tags, isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: adminService.getTags,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { color: PRESET_COLORS[0] },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTagPayload) => adminService.createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      setDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTagPayload> }) =>
      adminService.updateTag(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      setEditTag(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      setDeleteId(null)
    },
  })

  const openCreate = () => {
    setEditTag(null)
    reset({ nameVi: '', nameEn: '', color: PRESET_COLORS[0] })
    setDialogOpen(true)
  }

  const openEdit = (tag: Tag) => {
    setEditTag(tag)
    reset({ nameVi: tag.nameVi, nameEn: tag.nameEn, color: tag.color })
    setDialogOpen(true)
  }

  const onSubmit = (values: FormValues) => {
    if (editTag) updateMutation.mutate({ id: editTag.id, payload: values })
    else createMutation.mutate(values)
  }

  const selectedColor = watch('color')
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{t('admin.tags.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('admin.tags.addTag')}
        </Button>
      </Stack>

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid #eee' }} />}>
            {!tags?.length && (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                {t('common.noData')}
              </Box>
            )}
            {tags?.map((tag) => (
              isMobile ? (
                <Stack key={tag.id} direction="row" alignItems="center" spacing={1.5} px={2} py={1.5}>
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: tag.color, flexShrink: 0 }} />
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      <Chip
                        label={tag.nameVi}
                        size="small"
                        sx={{ bgcolor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}` }}
                      />
                      <Chip
                        label={tag.nameEn}
                        size="small"
                        sx={{ bgcolor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}` }}
                      />
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <IconButton size="small" onClick={() => openEdit(tag)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(tag.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ) : (
                <Stack key={tag.id} direction="row" alignItems="center" spacing={2} px={2} py={1.5}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: tag.color, flexShrink: 0 }} />
                  <Chip
                    label={tag.nameVi}
                    size="small"
                    sx={{ bgcolor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}` }}
                  />
                  <Chip
                    label={tag.nameEn}
                    size="small"
                    sx={{ bgcolor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}` }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton size="small" onClick={() => openEdit(tag)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(tag.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTag ? t('admin.tags.editTag') : t('admin.tags.addTag')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('admin.tags.nameVi')}
              {...register('nameVi', { required: t('common.required') })}
              error={!!errors.nameVi}
              helperText={errors.nameVi?.message}
              fullWidth
            />
            <TextField
              label={t('admin.tags.nameEn')}
              {...register('nameEn', { required: t('common.required') })}
              error={!!errors.nameEn}
              helperText={errors.nameEn?.message}
              fullWidth
            />
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                {t('admin.tags.color')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setValue('color', color)}
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                      border: selectedColor === color ? '3px solid #000' : '3px solid transparent',
                      transition: 'border 0.1s',
                    }}
                  />
                ))}
              </Stack>
              <TextField
                label="Hex"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                size="small"
                sx={{ mt: 1, width: 120 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title={t('common.confirm')}
        content={t('admin.tags.deleteConfirm')}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
