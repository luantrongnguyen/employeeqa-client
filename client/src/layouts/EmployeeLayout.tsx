import { useState } from 'react'
import {
  Box, AppBar, Toolbar, Typography, Container, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider,
} from '@mui/material'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import StarIcon from '@mui/icons-material/Star'
import LanguageToggle from '@/components/shared/LanguageToggle'

const DRAWER_WIDTH = 260

const NAV_ITEMS = [
  { key: 'askQuestion', path: '/', icon: <QuestionAnswerIcon /> },
  { key: 'featuredQA', path: '/featured', icon: <StarIcon /> },
]

export default function EmployeeLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.jfif"
          alt="logo"
          sx={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 1.5 }}
        />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            Enrich Co., Inc.
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1}>
            Employee Q&A
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ px: 1.5, pt: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(item.path); setDrawerOpen(false) }}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={t(`employee.nav.${item.key}`)}
                  primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Box component="img" src="/logo.jfif" alt="logo" sx={{ height: 36, mr: 1.5, objectFit: 'contain' }} />
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}>
            {t('employee.title')}
          </Typography>
          <LanguageToggle />
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: DRAWER_WIDTH } }}
      >
        {drawer}
      </Drawer>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
