import { Button, ButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const change = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <ButtonGroup size="small" variant="outlined">
      <Button
        onClick={() => change('vi')}
        variant={current === 'vi' ? 'contained' : 'outlined'}
        sx={{ minWidth: 40 }}
      >
        VI
      </Button>
      <Button
        onClick={() => change('en')}
        variant={current === 'en' ? 'contained' : 'outlined'}
        sx={{ minWidth: 40 }}
      >
        EN
      </Button>
    </ButtonGroup>
  )
}
