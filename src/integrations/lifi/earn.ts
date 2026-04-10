import type { EarnVault, EarnVaultsResponse } from '#/types'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

export const getEarnVaults = createServerFn({
  method: 'GET',
}).handler(async (): Promise<EarnVault[]> => {
  const apiKey = process.env.LIFI_EARN_API_KEY

  if (!apiKey) {
    throw new Error('Missing LIFI_EARN_API_KEY')
  }

  const response = await fetch(
    'https://earn.li.fi/v1/earn/vaults?chainId=8453&asset=USDC&sortBy=apy&limit=3',
    {
      headers: {
        'x-lifi-api-key': apiKey,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to load LI.FI Earn vaults')
  }

  const data = (await response.json()) as EarnVaultsResponse
  return data.data
})

export function earnVaultsQueryOptions() {
  return queryOptions<EarnVault[]>({
    queryKey: ['lifi-earn-vaults', 'base', 'usdc'],
    queryFn: () => getEarnVaults(),
    staleTime: 1000 * 60 * 5,
  })
}
