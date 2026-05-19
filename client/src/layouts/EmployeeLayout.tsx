import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/components/shared/LanguageToggle'

export default function EmployeeLayout() {
  const { t } = useTranslation()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Box component="img" src="/logo.jfif" alt="logo" sx={{ height: 36, mr: 1.5, objectFit: 'contain' }} />
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}>
            {t('employee.title')}
          </Typography>
          <LanguageToggle />
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
