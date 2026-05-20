import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'
import { employeeService } from '@/services/employeeService'
import FeaturedList from '@/components/employee/FeaturedList'

export default function FeaturedPublicPage() {
  const { t } = useTranslation()
  usePageTitle('employee.featuredTitle')

  const { data: featured, isLoading } = useQuery({
    queryKey: ['featured-public'],
    queryFn: employeeService.getFeatured,
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!featured || featured.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">{t('employee.noFeatured')}</Typography>
      </Box>
    )
  }

  return <FeaturedList items={featured} />
}
