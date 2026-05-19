import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useMutation } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/stores/authStore'
import LanguageToggle from '@/components/shared/LanguageToggle'

interface FormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const { t } = useTranslation()
  usePageTitle('admin.login.title')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()

  const loginMutation = useMutation({
    mutationFn: adminService.login,
    onSuccess: (data) => {
      setAuth(data.admin, data.accessToken)
      navigate('/admin/questions', { replace: true })
    },
  })

  const onSubmit = (values: FormValues) => {
    loginMutation.mutate(values)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh', bgcolor: 'background.default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageToggle />
      </Box>

      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box component="img" src="/logo.jfif" alt="logo" sx={{ height: 64, objectFit: 'contain', mb: 2 }} />
          <Typography variant="h5" fontWeight={700}>
            {t('admin.login.title')}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label={t('admin.login.username')}
            {...register('username', { required: t('common.required') })}
            error={!!errors.username}
            helperText={errors.username?.message}
            sx={{ mb: 2 }}
            autoComplete="username"
          />
          <TextField
            fullWidth
            type="password"
            label={t('admin.login.password')}
            {...register('password', { required: t('common.required') })}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 2 }}
            autoComplete="current-password"
          />

          {loginMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('admin.login.error')}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loginMutation.isPending}
            startIcon={loginMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {t('admin.login.submit')}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
