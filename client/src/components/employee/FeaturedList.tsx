import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Stack, Chip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import TagChip from '@/components/shared/TagChip'
import type { FeaturedQuestion } from '@/types'

interface Props {
  items: FeaturedQuestion[]
}

export default function FeaturedList({ items }: Props) {
  const { t, i18n } = useTranslation()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { data: tags } = useQuery({
    queryKey: ['tags-public'],
    queryFn: employeeService.getTags,
  })

  const filtered = selectedTag
    ? items.filter((item) => item.tags.some((tag) => tag.id === selectedTag))
    : items

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('employee.featuredTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('employee.featuredSubtitle')}
      </Typography>

      {tags && tags.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
          <Chip
            label={t('common.all')}
            onClick={() => setSelectedTag(null)}
            color={selectedTag === null ? 'primary' : 'default'}
            variant={selectedTag === null ? 'filled' : 'outlined'}
          />
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={i18n.language === 'vi' ? tag.nameVi : tag.nameEn}
              onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
              sx={{
                bgcolor: selectedTag === tag.id ? tag.color + '33' : undefined,
                borderColor: tag.color,
                color: tag.color,
                border: '1px solid',
              }}
            />
          ))}
        </Stack>
      )}

      <Stack spacing={2}>
        {filtered.map((item) => (
          <FeaturedCard key={item.id} item={item} />
        ))}
      </Stack>
    </Box>
  )
}

function FeaturedCard({ item }: { item: FeaturedQuestion }) {
  return (
    <Card variant="outlined">
      <CardContent>
        {item.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
            {item.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </Stack>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
            Q
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {item.publishedQuestion}
          </Typography>
          {item.publishedImageUrl && (
            <Box
              component="img"
              src={item.publishedImageUrl}
              alt=""
              sx={{ mt: 1, maxHeight: 200, borderRadius: 1, maxWidth: '100%' }}
            />
          )}
        </Box>

        <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
          <Typography variant="caption" color="primary" fontWeight={600} display="block" mb={0.5}>
            A
          </Typography>
          <Typography variant="body2">
            {item.publishedAnswer}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
