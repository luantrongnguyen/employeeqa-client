import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Autocomplete, TextField, Chip, CircularProgress,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { QuestionThread, Tag } from '@/types'

interface Props {
  open: boolean
  thread: QuestionThread
  onClose: () => void
  onSuccess: () => void
}

export default function TagAssignDialog({ open, thread, onClose, onSuccess }: Props) {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState<Tag[]>(thread.tags)

  const { data: allTags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: adminService.getTags,
  })

  const saveMutation = useMutation({
    mutationFn: () => adminService.assignTags(thread.id, selected.map((tag) => tag.id)),
    onSuccess,
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('admin.thread.assignTags')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Autocomplete
          multiple
          options={allTags ?? []}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          getOptionLabel={(opt) => i18n.language === 'vi' ? opt.nameVi : opt.nameEn}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={i18n.language === 'vi' ? option.nameVi : option.nameEn}
                {...getTagProps({ index })}
                key={option.id}
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label={t('admin.featured.tags')} sx={{ mt: 1 }} />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          variant="contained"
          disabled={saveMutation.isPending}
          startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
