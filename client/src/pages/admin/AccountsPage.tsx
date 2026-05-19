import { useState } from 'react'
import {
  Box, Typography, Paper, Stack, IconButton, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, Divider, useTheme, useMediaQuery,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LockResetIcon from '@mui/icons-material/LockReset'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminService } from '@/services/adminService'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useAuthStore } from '@/stores/authStore'
import type { Admin } from '@/types'

export default function AccountsPage() {
  const { t } = useTranslation()
  usePageTitle('admin.accounts.title')
  const queryClient = useQueryClient()
  const { admin: currentAdmin } = useAuthStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Admin | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: adminService.getAccounts,
  })

  const { register: regCreate, handleSubmit: handleCreate, formState: { errors: errCreate }, reset: resetCreate } = useForm<{
    username: string; displayName: string; password: string
  }>()
  const { register: regPwd, handleSubmit: handlePwd, formState: { errors: errPwd }, reset: resetPwd } = useForm<{
    newPassword: string
  }>()

  const createMutation = useMutation({
    mutationFn: adminService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      setCreateOpen(false)
      resetCreate()
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: adminService.toggleActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
  })

  const changePwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminService.changePassword(id, password),
    onSuccess: () => {
      setPasswordTarget(null)
      resetPwd()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAccount,
    onSuccess: () => {
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
    },
  })

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{t('admin.accounts.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          {t('admin.accounts.addAccount')}
        </Button>
      </Stack>

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : isMobile ? (
          <List disablePadding>
            {accounts?.map((acc, index) => (
              <Box key={acc.id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 2, py: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, flexShrink: 0 }}>
                      {acc.displayName[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={500} noWrap>{acc.displayName}</Typography>
                        {acc.id === currentAdmin?.id && (
                          <Typography variant="caption" color="primary">(you)</Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {acc.username}
                        </Typography>
                        <Chip
                          label={acc.isActive ? t('admin.accounts.active') : t('admin.accounts.inactive')}
                          color={acc.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <IconButton
                        size="small"
                        onClick={() => toggleActiveMutation.mutate(acc.id)}
                        disabled={acc.id === currentAdmin?.id}
                        title={acc.isActive ? t('admin.accounts.deactivate') : t('admin.accounts.activate')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => { setPasswordTarget(acc); resetPwd() }}
                        title={t('admin.accounts.changePassword')}
                      >
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(acc.id)}
                        disabled={acc.id === currentAdmin?.id}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </ListItem>
              </Box>
            ))}
          </List>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.accounts.displayName')}</TableCell>
                  <TableCell>{t('admin.accounts.username')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts?.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                          {acc.displayName[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{acc.displayName}</Typography>
                          {acc.id === currentAdmin?.id && (
                            <Typography variant="caption" color="primary">(you)</Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{acc.username}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={acc.isActive ? t('admin.accounts.active') : t('admin.accounts.inactive')}
                        color={acc.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => toggleActiveMutation.mutate(acc.id)}
                          disabled={acc.id === currentAdmin?.id}
                          title={acc.isActive ? t('admin.accounts.deactivate') : t('admin.accounts.activate')}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => { setPasswordTarget(acc); resetPwd() }}
                          title={t('admin.accounts.changePassword')}
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(acc.id)}
                          disabled={acc.id === currentAdmin?.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('admin.accounts.addAccount')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('admin.accounts.displayName')}
              {...regCreate('displayName', { required: t('common.required') })}
              error={!!errCreate.displayName}
              helperText={errCreate.displayName?.message}
              fullWidth
            />
            <TextField
              label={t('admin.accounts.username')}
              {...regCreate('username', { required: t('common.required') })}
              error={!!errCreate.username}
              helperText={errCreate.username?.message}
              fullWidth
            />
            <TextField
              type="password"
              label={t('admin.accounts.password')}
              {...regCreate('password', { required: t('common.required'), minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
              error={!!errCreate.password}
              helperText={errCreate.password?.message}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreate((v) => createMutation.mutate(v))}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordTarget} onClose={() => setPasswordTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('admin.accounts.changePassword')} — {passwordTarget?.displayName}</DialogTitle>
        <DialogContent>
          <TextField
            type="password"
            label={t('admin.accounts.newPassword')}
            {...regPwd('newPassword', { required: t('common.required'), minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
            error={!!errPwd.newPassword}
            helperText={errPwd.newPassword?.message}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordTarget(null)}>{t('common.cancel')}</Button>
          <Button
            onClick={handlePwd((v) => passwordTarget && changePwdMutation.mutate({ id: passwordTarget.id, password: v.newPassword }))}
            variant="contained"
            disabled={changePwdMutation.isPending}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title={t('common.confirm')}
        content={t('admin.accounts.deleteConfirm')}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
