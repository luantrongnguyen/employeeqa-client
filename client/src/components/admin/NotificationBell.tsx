import { useState } from 'react'
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItem,
  ListItemText, ListItemButton, Divider, Button, CircularProgress,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { fromNow } from '@/utils/date'

export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: adminService.getNotifications,
    refetchInterval: 30000,
  })

  const markAllMutation = useMutation({
    mutationFn: adminService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: adminService.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const handleClose = () => setAnchor(null)

  const handleClickNotification = (notifId: string, threadId: string) => {
    markOneMutation.mutate(notifId)
    handleClose()
    navigate(`/admin/questions/${threadId}`)
  }

  return (
    <>
      <IconButton onClick={handleOpen} color="inherit">
        <Badge badgeContent={data?.unreadCount ?? 0} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('admin.notifications.title')}
            {(data?.unreadCount ?? 0) > 0 && (
              <Typography component="span" variant="caption" color="error" ml={1}>
                {data?.unreadCount} {t('admin.notifications.unread')}
              </Typography>
            )}
          </Typography>
          {(data?.unreadCount ?? 0) > 0 && (
            <Button size="small" onClick={() => markAllMutation.mutate()}>
              {t('admin.notifications.markAllRead')}
            </Button>
          )}
        </Box>
        <Divider />

        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : !data?.notifications.length ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('admin.notifications.noNotifications')}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {data.notifications.map((notif) => (
              <ListItem
                key={notif.id}
                disablePadding
                sx={{ bgcolor: notif.isRead ? 'transparent' : 'primary.50' }}
              >
                <ListItemButton onClick={() => handleClickNotification(notif.id, notif.threadId)}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600}>
                        {t(`admin.notifications.${notif.type}`)}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" noWrap>
                          {notif.threadPreview}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {fromNow(notif.createdAt, i18n.language)}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  )
}
