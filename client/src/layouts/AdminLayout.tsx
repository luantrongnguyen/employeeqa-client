import { useState } from 'react'
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Menu, MenuItem, Divider, Tooltip,
} from '@mui/material'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import StarIcon from '@mui/icons-material/Star'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/services/adminService'
import LanguageToggle from '@/components/shared/LanguageToggle'
import NotificationBell from '@/components/admin/NotificationBell'
import { useAdminSocket } from '@/hooks/useAdminSocket'

const DRAWER_WIDTH = 248

const navItems = [
  { key: 'questions', path: '/admin/questions', icon: <QuestionAnswerIcon /> },
  { key: 'featured', path: '/admin/featured', icon: <StarIcon /> },
  { key: 'tags', path: '/admin/tags', icon: <LocalOfferIcon /> },
  { key: 'accounts', path: '/admin/accounts', icon: <PeopleIcon /> },
]

const SIDEBAR_BG = 'linear-gradient(180deg, #1a237e 0%, #283593 60%, #1565c0 100%)'

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: SIDEBAR_BG }}>
      {/* Logo area */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.jfif"
          alt="logo"
          sx={{ height: 36, width: 36, objectFit: 'cover', borderRadius: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="white" lineHeight={1.2}>
            Admin Panel
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.55)" lineHeight={1}>
            Enrich Co., Inc.
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />

      {/* Nav items */}
      <List sx={{ px: 1.5, pt: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    color: 'white',
                  },
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  transition: 'all 0.15s',
                  ...(active && {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    borderLeft: '3px solid rgba(255,255,255,0.8)',
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={t(`nav.${item.key}`)}
                  primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* User info at bottom */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />
      <Box
        sx={{
          px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        }}
        onClick={handleLogout}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 700, color: 'white' }}>
          {admin?.displayName?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="white" noWrap>
            {admin?.displayName}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.55)">
            {t('nav.logout')}
          </Typography>
        </Box>
        <LogoutIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => ({ xs: theme.zIndex.appBar, sm: theme.zIndex.drawer + 1 }),
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 0.5 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 1, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <LanguageToggle />
          <NotificationBell />
          <Tooltip title={admin?.displayName ?? ''}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
                {admin?.displayName?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 160, mt: 0.5 } }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="body2" fontWeight={600}>{admin?.displayName}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
              <LogoutIcon fontSize="small" />
              {t('nav.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.08)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
