import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Tag } from '@/types'

interface Props {
  tag: Tag
  onDelete?: () => void
  size?: 'small' | 'medium'
}

export default function TagChip({ tag, onDelete, size = 'small' }: Props) {
  const { i18n } = useTranslation()
  const label = i18n.language === 'vi' ? tag.nameVi : tag.nameEn

  return (
    <Chip
      label={label}
      size={size}
      onDelete={onDelete}
      sx={{
        bgcolor: tag.color + '22',
        color: tag.color,
        borderColor: tag.color,
        border: '1px solid',
        fontWeight: 500,
      }}
    />
  )
}
