import { useState } from 'react'
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Menu, MenuItem, Divider,
} from '@mui/material'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import StarIcon from '@mui/icons-material/Star'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import PeopleIcon from '@mui/icons-material/People'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/adminService'
import LanguageToggle from '@/components/shared/LanguageToggle'
import NotificationBell from '@/components/admin/NotificationBell'
import { useAdminSocket } from '@/hooks/useAdminSocket'

const DRAWER_WIDTH = 240

const navItems = [
  { key: 'questions', path: '/admin/questions', icon: <QuestionAnswerIcon /> },
  { key: 'featured', path: '/admin/featured', icon: <StarIcon /> },
  { key: 'tags', path: '/admin/tags', icon: <LocalOfferIcon /> },
  { key: 'accounts', path: '/admin/accounts', icon: <PeopleIcon /> },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, clearAuth } = useAuthStore()
  useAdminSocket()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    try { await adminService.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/admin/login')
  }

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <Box component="img" src="/logo.jfif" alt="logo" sx={{ height: 32, objectFit: 'contain' }} />
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              sx={{ borderRadius: 1, mx: 1, my: 0.25 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={t(`nav.${item.key}`)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <LanguageToggle />
          <NotificationBell />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {admin?.displayName?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {admin?.displayName}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
