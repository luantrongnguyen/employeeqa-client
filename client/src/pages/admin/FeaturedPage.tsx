import { useState } from 'react'
import {
  Box, Typography, Paper, Stack, IconButton, Chip,
  CircularProgress, useTheme, useMediaQuery,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import TagChip from '@/components/shared/TagChip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FeaturedFormDialog from '@/components/admin/FeaturedFormDialog'
import type { FeaturedQuestion } from '@/types'

export default function FeaturedPage() {
  const { t } = useTranslation()
  usePageTitle('admin.featured.title')
  const queryClient = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<FeaturedQuestion | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-featured'],
    queryFn: adminService.getFeatured,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminService.removeFromFeatured(id),
    onSuccess: () => {
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-featured'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      adminService.updateFeatured(id, { isVisible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-featured'] }),
  })

  if (isLoading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t('admin.featured.title')}
      </Typography>

      {!data?.length && (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          {t('common.noData')}
        </Paper>
      )}

      <Stack spacing={2}>
        {data?.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: isMobile ? 2 : 3 }}>
            {isMobile ? (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip
                    label={item.isVisible ? t('admin.featured.visible') : t('admin.featured.hidden')}
                    size="small"
                    color={item.isVisible ? 'success' : 'default'}
                  />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => toggleMutation.mutate({ id: item.id, isVisible: !item.isVisible })}
                      title={item.isVisible ? t('admin.featured.makeHidden') : t('admin.featured.makeVisible')}
                    >
                      {item.isVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => setEditItem(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {item.tags.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
                    {item.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                  </Stack>
                )}
              </>
            ) : (
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {item.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    label={item.isVisible ? t('admin.featured.visible') : t('admin.featured.hidden')}
                    size="small"
                    color={item.isVisible ? 'success' : 'default'}
                  />
                  <IconButton
                    size="small"
                    onClick={() => toggleMutation.mutate({ id: item.id, isVisible: !item.isVisible })}
                    title={item.isVisible ? t('admin.featured.makeHidden') : t('admin.featured.makeVisible')}
                  >
                    {item.isVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditItem(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            )}

            <Box mb={1.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Q</Typography>
              <Typography variant="body1" fontWeight={500} mt={0.5}>
                {item.publishedQuestion}
              </Typography>
            </Box>

            <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
              <Typography variant="caption" color="primary" fontWeight={600}>A</Typography>
              <Typography variant="body2" mt={0.5}>
                {item.publishedAnswer}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      <ConfirmDialog
        open={!!deleteId}
        title={t('common.confirm')}
        content={t('admin.featured.removeConfirm')}
        onConfirm={() => deleteId && removeMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {editItem && (
        <FeaturedFormDialog
          open={!!editItem}
          featured={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => {
            setEditItem(null)
            queryClient.invalidateQueries({ queryKey: ['admin-featured'] })
          }}
        />
      )}
    </Box>
  )
}
