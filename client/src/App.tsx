import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import theme from '@/theme'
import '@/i18n'

import EmployeeLayout from '@/layouts/EmployeeLayout'
import AdminLayout from '@/layouts/AdminLayout'
import RequireAuth from '@/layouts/RequireAuth'

import HomePage from '@/pages/employee/HomePage'
import FeaturedPublicPage from '@/pages/employee/FeaturedPublicPage'
import ThreadPage from '@/pages/employee/ThreadPage'
import LoginPage from '@/pages/admin/LoginPage'
import QuestionsListPage from '@/pages/admin/QuestionsListPage'
import ThreadDetailPage from '@/pages/admin/ThreadDetailPage'
import FeaturedPage from '@/pages/admin/FeaturedPage'
import TagsPage from '@/pages/admin/TagsPage'
import AccountsPage from '@/pages/admin/AccountsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Employee site */}
            <Route element={<EmployeeLayout />}>
              <Route index element={<HomePage />} />
              <Route path="featured" element={<FeaturedPublicPage />} />
              <Route path="q/:accessToken" element={<ThreadPage />} />
            </Route>

            {/* Admin — login (public) */}
            <Route path="admin/login" element={<LoginPage />} />

            {/* Admin — protected */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route path="admin" element={<Navigate to="/admin/questions" replace />} />
                <Route path="admin/questions" element={<QuestionsListPage />} />
                <Route path="admin/questions/:threadId" element={<ThreadDetailPage />} />
                <Route path="admin/featured" element={<FeaturedPage />} />
                <Route path="admin/tags" element={<TagsPage />} />
                <Route path="admin/accounts" element={<AccountsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
