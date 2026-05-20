import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, FormControlLabel, Checkbox, Divider } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
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
  rememberMe: boolean
}

export default function LoginPage() {
  const { t } = useTranslation()
  usePageTitle('admin.login.title')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { rememberMe: true },
  })

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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          top: -100,
          left: -100,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          bottom: -80,
          right: -80,
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <LanguageToggle />
      </Box>

      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Header banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1565c0, #1a237e)',
            px: 4,
            py: 3,
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src="/logo.jfif"
            alt="logo"
            sx={{
              height: 72,
              objectFit: 'contain',
              mb: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          />
          <Typography variant="body2" color="rgba(255,255,255,0.75)" sx={{ mt: 0.5 }}>
            Employee Q&A — Admin Portal
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ px: 4, py: 3.5 }}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 2.5 }}>
            {t('admin.login.title')}
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label={t('admin.login.username')}
              {...register('username', { required: t('common.required') })}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{ mb: 2 }}
              autoComplete="username"
              size="medium"
            />
            <TextField
              fullWidth
              type="password"
              label={t('admin.login.password')}
              {...register('password', { required: t('common.required') })}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 1 }}
              autoComplete="current-password"
              size="medium"
            />

            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} size="small" color="primary" />}
                  label={
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.login.rememberMe')}
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
              )}
            />

            {loginMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }} variant="filled">
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
              sx={{
                py: 1.4,
                fontWeight: 700,
                fontSize: '1rem',
                background: 'linear-gradient(90deg, #1565c0, #1a237e)',
                boxShadow: '0 4px 12px rgba(21,101,192,0.4)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0d47a1, #1a237e)',
                  boxShadow: '0 6px 16px rgba(21,101,192,0.5)',
                },
              }}
            >
              {t('admin.login.submit')}
            </Button>
          </Box>

          <Divider sx={{ mt: 3, mb: 2 }} />
          <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
            © {new Date().getFullYear()} Enrich Co., Inc. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
