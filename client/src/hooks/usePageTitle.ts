import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const APP_NAME = 'Enrich Co., Inc.'

export function usePageTitle(key: string) {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    document.title = `${t(key)} — ${APP_NAME}`
  }, [key, i18n.language])
}
