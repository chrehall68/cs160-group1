import { apiRequest } from '#/lib/api'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link'
import { usePlaidLink } from 'react-plaid-link'

export const Route = createFileRoute('/external')({
  component: RouteComponent,
})

function Linker({ token }: { token: string }) {
  const onSuccess: PlaidLinkOnSuccess = (publicToken, metadata) => {
    console.log('publicToken', publicToken)
    console.log('metadata', metadata)
  }

  const plaidConfig: PlaidLinkOptions = {
    onSuccess,
    onExit: () => {
      console.log('exit')
    },
    token,
  }

  const { open, exit, ready } = usePlaidLink(plaidConfig)
  useEffect(() => {
    if (ready) {
      open()
    }
  })

  return <div>Hi</div>
}
function RouteComponent() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  console.log('linkToken', linkToken)

  return (
    <div>
      Hello "/external"!
      <button
        onClick={async () => {
          const data: any = await apiRequest('/api/external/initiate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: '20.33',
              account_id: 1,
            }),
          })
          setLinkToken(data.link_token)
        }}
      >
        Link now
      </button>
      <Linker token={linkToken || ''} />
    </div>
  )
}
