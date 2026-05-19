import { useState } from 'react'
import {
  Box, Paper, Typography, Stack, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  Tooltip, CircularProgress, OutlinedInput, Checkbox, ListItemText,
  List, ListItemButton, Divider, useTheme, useMediaQuery,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ImageIcon from '@mui/icons-material/Image'
import StarIcon from '@mui/icons-material/Star'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import TagChip from '@/components/shared/TagChip'
import { fromNow } from '@/utils/date'
import type { ThreadStatus, QuestionsFilter } from '@/types'

const STATUS_OPTIONS: (ThreadStatus | 'all')[] = ['all', 'open', 'answered', 'hidden', 'closed']

const STATUS_COLOR: Record<ThreadStatus, 'warning' | 'success' | 'default' | 'error'> = {
  open: 'warning',
  answered: 'success',
  hidden: 'error',
  closed: 'default',
}

export default function QuestionsListPage() {
  const { t, i18n } = useTranslation()
  usePageTitle('admin.questions.title')
  const navigate = useNavigate()

  const [filter, setFilter] = useState<QuestionsFilter>({
    status: 'all',
    page: 1,
    pageSize: 20,
  })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { data: tagsData } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: adminService.getTags,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', filter],
    queryFn: () => adminService.getQuestions(filter),
  })

  const handleFilterChange = (partial: Partial<QuestionsFilter>) => {
    setFilter((prev) => ({ ...prev, ...partial, page: 1 }))
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t('admin.questions.title')}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <TextField
            type="date"
            label={t('admin.questions.filterDate')}
            size="small"
            value={filter.date ?? ''}
            onChange={(e) => handleFilterChange({ date: e.target.value || undefined })}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.questions.filterStatus')}</InputLabel>
            <Select
              value={filter.status ?? 'all'}
              label={t('admin.questions.filterStatus')}
              onChange={(e) => handleFilterChange({ status: e.target.value as ThreadStatus | 'all' })}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s === 'all' ? t('common.all') : t(`admin.questions.status_${s}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {tagsData && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('admin.questions.filterTag')}</InputLabel>
              <Select
                multiple
                value={filter.tagIds ?? []}
                input={<OutlinedInput label={t('admin.questions.filterTag')} />}
                onChange={(e) => handleFilterChange({ tagIds: e.target.value as string[] })}
                renderValue={(selected) =>
                  tagsData
                    .filter((tag) => selected.includes(tag.id))
                    .map((tag) => (i18n.language === 'vi' ? tag.nameVi : tag.nameEn))
                    .join(', ')
                }
              >
                {tagsData.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Checkbox checked={(filter.tagIds ?? []).includes(tag.id)} />
                    <ListItemText primary={i18n.language === 'vi' ? tag.nameVi : tag.nameEn} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            size="small"
            placeholder={t('admin.questions.filterKeyword')}
            value={filter.keyword ?? ''}
            onChange={(e) => handleFilterChange({ keyword: e.target.value || undefined })}
            sx={{ minWidth: 200 }}
          />
        </Stack>
      </Paper>

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              <List disablePadding>
                {data?.data.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">{t('common.noData')}</Typography>
                  </Box>
                )}
                {data?.data.map((thread, index) => {
                  const firstMessage = thread.messages?.[0]
                  return (
                    <Box key={thread.id}>
                      {index > 0 && <Divider />}
                      <ListItemButton
                        onClick={() => navigate(`/admin/questions/${thread.id}`)}
                        sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <Chip
                              label={t(`admin.questions.status_${thread.status}`)}
                              color={STATUS_COLOR[thread.status]}
                              size="small"
                            />
                            {thread.isFeatured && (
                              <Chip
                                icon={<StarIcon sx={{ fontSize: 12 }} />}
                                label={t('admin.questions.featured')}
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: 10 }}
                              />
                            )}
                            {firstMessage?.imageUrl && (
                              <Tooltip title={t('admin.questions.hasImage')}>
                                <ImageIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                          </Stack>

                          <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                            {firstMessage?.content?.slice(0, 120)}
                            {(firstMessage?.content?.length ?? 0) > 120 ? '...' : ''}
                          </Typography>

                          <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={0.5}>
                            {thread.tags.map((tag) => (
                              <TagChip key={tag.id} tag={tag} />
                            ))}
                          </Stack>

                          <Typography variant="caption" color="text.secondary">
                            {fromNow(thread.createdAt, i18n.language)}
                            {' · '}
                            {t('admin.questions.messagesCount', { count: thread.messageCount })}
                          </Typography>
                        </Box>

                        <OpenInNewIcon fontSize="small" color="action" sx={{ ml: 1, mt: 0.5, flexShrink: 0 }} />
                      </ListItemButton>
                    </Box>
                  )
                })}
              </List>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.questions.filterKeyword')}</TableCell>
                      <TableCell width={160}>{t('common.status')}</TableCell>
                      <TableCell width={200}>{t('admin.questions.filterTag')}</TableCell>
                      <TableCell width={120}>{t('common.createdAt')}</TableCell>
                      <TableCell width={60} align="center"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          {t('common.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.data.map((thread) => {
                      const firstMessage = thread.messages?.[0]
                      return (
                        <TableRow
                          key={thread.id}
                          hover
                          onClick={() => navigate(`/admin/questions/${thread.id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Box>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                                  {firstMessage?.content?.slice(0, 100)}
                                  {(firstMessage?.content?.length ?? 0) > 100 ? '...' : ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('admin.questions.messagesCount', { count: thread.messageCount })}
                                  {thread.isFeatured && (
                                    <Chip
                                      icon={<StarIcon sx={{ fontSize: 12 }} />}
                                      label={t('admin.questions.featured')}
                                      size="small"
                                      color="warning"
                                      sx={{ ml: 1, height: 18, fontSize: 10 }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                              {firstMessage?.imageUrl && (
                                <Tooltip title={t('admin.questions.hasImage')}>
                                  <ImageIcon fontSize="small" color="action" />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(`admin.questions.status_${thread.status}`)}
                              color={STATUS_COLOR[thread.status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {thread.tags.map((tag) => (
                                <TagChip key={tag.id} tag={tag} />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {fromNow(thread.createdAt, i18n.language)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/questions/${thread.id}`)}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              component="div"
              count={data?.total ?? 0}
              page={(filter.page ?? 1) - 1}
              rowsPerPage={filter.pageSize ?? 20}
              rowsPerPageOptions={[20, 50]}
              onPageChange={(_, page) => setFilter((prev) => ({ ...prev, page: page + 1 }))}
              onRowsPerPageChange={(e) =>
                setFilter((prev) => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }))
              }
            />
          </>
        )}
      </Paper>
    </Box>
  )
}
