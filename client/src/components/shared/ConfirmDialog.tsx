import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
  onCancel: () => void
  confirmColor?: 'error' | 'primary' | 'warning'
}

export default function ConfirmDialog({ open, title, content, onConfirm, onCancel, confirmColor = 'error' }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
