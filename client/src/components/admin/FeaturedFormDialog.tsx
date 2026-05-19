import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Switch, Stack,
  CircularProgress, Autocomplete, Chip,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { QuestionThread, Tag, FeaturedQuestion } from '@/types'

interface Props {
  open: boolean
  thread?: QuestionThread
  featured?: FeaturedQuestion
  onClose: () => void
  onSuccess: () => void
}

interface FormValues {
  publishedQuestion: string
  publishedAnswer: string
  tags: Tag[]
  isVisible: boolean
}

export default function FeaturedFormDialog({ open, thread, featured, onClose, onSuccess }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = !!featured

  const { data: allTags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: adminService.getTags,
  })

  const firstEmployeeMsg = thread?.messages.find((m) => m.senderType === 'employee')
  const lastAdminMsg = thread?.messages.filter((m) => m.senderType === 'admin').at(-1)

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      publishedQuestion: featured?.publishedQuestion ?? firstEmployeeMsg?.content ?? '',
      publishedAnswer: featured?.publishedAnswer ?? lastAdminMsg?.content ?? '',
      tags: featured?.tags ?? thread?.tags ?? [],
      isVisible: featured?.isVisible ?? true,
    },
  })

  const addMutation = useMutation({
    mutationFn: (values: FormValues) =>
      adminService.addToFeatured(thread!.id, {
        publishedQuestion: values.publishedQuestion,
        publishedAnswer: values.publishedAnswer,
        tagIds: values.tags.map((t) => t.id),
        isVisible: values.isVisible,
      }),
    onSuccess,
  })

  const editMutation = useMutation({
    mutationFn: (values: FormValues) =>
      adminService.updateFeatured(featured!.id, {
        publishedQuestion: values.publishedQuestion,
        publishedAnswer: values.publishedAnswer,
        tagIds: values.tags.map((t) => t.id),
        isVisible: values.isVisible,
      }),
    onSuccess,
  })

  const onSubmit = (values: FormValues) => {
    if (isEdit) editMutation.mutate(values)
    else addMutation.mutate(values)
  }

  const isPending = addMutation.isPending || editMutation.isPending

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? t('admin.featured.editTitle') : t('admin.featured.addTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Controller
            name="publishedQuestion"
            control={control}
            rules={{ required: t('common.required') }}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('admin.featured.publishedQuestion')}
                multiline
                minRows={3}
                fullWidth
                error={!!errors.publishedQuestion}
                helperText={errors.publishedQuestion?.message}
              />
            )}
          />
          <Controller
            name="publishedAnswer"
            control={control}
            rules={{ required: t('common.required') }}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('admin.featured.publishedAnswer')}
                multiline
                minRows={3}
                fullWidth
                error={!!errors.publishedAnswer}
                helperText={errors.publishedAnswer?.message}
              />
            )}
          />
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={allTags ?? []}
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
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
                  <TextField {...params} label={t('admin.featured.tags')} />
                )}
              />
            )}
          />
          <Controller
            name="isVisible"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={t('admin.featured.isVisible')}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>{t('common.cancel')}</Button>
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
  )
}
