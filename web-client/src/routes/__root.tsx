import { TanStackDevtools } from '@tanstack/react-devtools'
import { Outlet, createRootRoute, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect, useRef } from 'react'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { useAuthSession } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'
import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup'])

// Redirects to `/login` and drops cached query data when the session ends
// mid-page, so a token expiring (or being cleared elsewhere) can't leave a
// protected page rendering stale data. Skipped on public routes so an explicit
// `/login` / `/signup` navigation from elsewhere isn't clobbered.
function AuthRedirect() {
  const auth = useAuthSession()
  const router = useRouter()
  const previousTokenRef = useRef(auth.token)

  useEffect(() => {
    const previousToken = previousTokenRef.current
    previousTokenRef.current = auth.token

    if (previousToken && !auth.token) {
      queryClient.clear()
      const pathname = router.state.location.pathname
      if (!PUBLIC_ROUTES.has(pathname)) {
        router.navigate({ to: '/login' })
      }
    }
  }, [auth.token, router])

  return null
}

function RootComponent() {
  return (
    <>
      <AuthRedirect />
      <div className="flex min-h-screen flex-col">
        {/* global header/navigation */}
        <Header />

        {/* route outlet will render page content */}
        <div className="flex-1">
          <Outlet />
        </div>

        <Footer />
      </div>

      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
