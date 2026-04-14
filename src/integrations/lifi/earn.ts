import type { ComposerQuote } from '#/integrations/lifi/composer'
import type {
  EarnPortfolioPosition,
  EarnPortfolioPositionsResponse,
  EarnVault,
  EarnVaultsResponse,
} from '#/types'
import { SUPPORTED_ASSETS } from '#/utils'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import {
  getPublicClient,
  sendTransaction,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { erc20Abi, zeroAddress } from 'viem'
import type { Address, Hex } from 'viem'
import type { useConfig } from 'wagmi'
import { z } from 'zod'

const walletAddressSchema = z.object({
  walletAddress: z.string().min(1),
})

const MAX_PREFERRED_VAULT_APY = 20

const SUPPORTED_EARN_CHAIN_IDS = Object.values(SUPPORTED_ASSETS.networks)
  .map((network) => network.id)

const SUPPORTED_EARN_TOKEN_SYMBOLS = Object.values(SUPPORTED_ASSETS.tokens).map(
  (token) => token.symbol,
)

async function fetchEarnVaultsByChainAndAsset({
  apiKey,
  chainId,
  asset,
}: {
  apiKey: string
  chainId: number
  asset: string
}) {
  const params = new URLSearchParams({
    chainId: String(chainId),
    asset,
    sortBy: 'apy',
    limit: '5',
  })

  const response = await fetch(`https://earn.li.fi/v1/earn/vaults?${params}`, {
    headers: {
      'x-lifi-api-key': apiKey,
    },
  })  

  if (!response.ok) {
    throw new Error(`Failed to load LI.FI Earn vaults for ${asset} on ${chainId}`)
  }

  const data = (await response.json()) as EarnVaultsResponse
  return data.data
}

export const getEarnVaults = createServerFn({
  method: 'GET',
}).handler(async (): Promise<EarnVault[]> => {
  const apiKey = process.env.LIFI_EARN_API_KEY

  if (!apiKey) {
    throw new Error('Missing LIFI_EARN_API_KEY')
  }

  const vaultResponses = await Promise.all(
    SUPPORTED_EARN_CHAIN_IDS.flatMap((chainId) =>
      SUPPORTED_EARN_TOKEN_SYMBOLS.map((asset) =>
        fetchEarnVaultsByChainAndAsset({
          apiKey,
          chainId,
          asset,
        }),
      ),
    ),
  )

  const vaultsByChain = new Map<number, EarnVault[]>()

  vaultResponses
    .flat()
    .filter((vault) => vault.isTransactional)
    .forEach((vault) => {
      const existingVaults = vaultsByChain.get(vault.chainId) ?? []
      existingVaults.push(vault)
      vaultsByChain.set(vault.chainId, existingVaults)
    })

  const topVaultByChain = new Map<number, EarnVault>()

  vaultsByChain.forEach((vaults, chainId) => {
    const sortedVaults = [...vaults].sort(
      (left, right) => right.analytics.apy.total - left.analytics.apy.total,
    )
    const preferredVault =
      sortedVaults.find(
        (vault) => vault.analytics.apy.total <= MAX_PREFERRED_VAULT_APY,
      ) ?? sortedVaults[0]

    if (preferredVault) {
      topVaultByChain.set(chainId, preferredVault)
    }
  })

  return [...topVaultByChain.values()].sort(
    (left, right) => right.analytics.apy.total - left.analytics.apy.total,
  )
})

export function earnVaultsQueryOptions() {
  return queryOptions<EarnVault[]>({
    queryKey: ['lifi-earn-vaults', 'supported-chains', 'supported-tokens'],
    queryFn: () => getEarnVaults(),
    staleTime: 1000 * 60 * 5,
  })
}

export const getEarnPortfolioPositions = createServerFn({
  method: 'GET',
})
  .inputValidator((input: { walletAddress: string }) =>
    walletAddressSchema.parse(input),
  )
  .handler(async ({ data }): Promise<EarnPortfolioPosition[]> => {
    const apiKey = process.env.LIFI_EARN_API_KEY

    if (!apiKey) {
      throw new Error('Missing LIFI_EARN_API_KEY')
    }

    const response = await fetch(
      `https://earn.li.fi/v1/earn/portfolio/${data.walletAddress}/positions`,
      {
        headers: {
          'x-lifi-api-key': apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to load LI.FI Earn portfolio positions')
    }

    const portfolio = (await response.json()) as EarnPortfolioPositionsResponse

    return portfolio.positions
  })

export function earnPortfolioPositionsQueryOptions(walletAddress: string) {
  return queryOptions<EarnPortfolioPosition[]>({
    queryKey: ['lifi-earn-portfolio-positions', walletAddress],
    queryFn: () => getEarnPortfolioPositions({ data: { walletAddress } }),
    enabled: Boolean(walletAddress),
    staleTime: 1000 * 60,
  })
}

export async function executeVaultQuote({
  quote,
  account,
  chainId,
  config,
}: {
  quote: Pick<ComposerQuote, 'action' | 'estimate' | 'transactionRequest'>
  account: Address
  chainId: number
  config: ReturnType<typeof useConfig>
}) {
  const approvalAddress = quote.estimate.approvalAddress as Address | undefined
  const fromTokenAddress = quote.action.fromToken.address as Address
  const publicClient = getPublicClient(config, { chainId })

  if (
    approvalAddress &&
    fromTokenAddress.toLowerCase() !== zeroAddress.toLowerCase()
  ) {
    // @ts-expect-error wagmi public client contract typing is narrower than the runtime viem call here
    const allowance = await publicClient.readContract({
      abi: erc20Abi,
      address: fromTokenAddress,
      functionName: 'allowance',
      args: [account, approvalAddress],
    })

    if (allowance < BigInt(quote.action.fromAmount)) {
      const approvalHash = await writeContract(config, {
        abi: erc20Abi,
        account,
        address: fromTokenAddress,
        functionName: 'approve',
        args: [approvalAddress, BigInt(quote.action.fromAmount)],
        chainId,
      })

      await waitForTransactionReceipt(config, {
        chainId,
        hash: approvalHash,
      })
    }
  }

  const txHash = await sendTransaction(config, {
    account,
    chainId,
    to: quote.transactionRequest.to as Address,
    data: quote.transactionRequest.data ?? ('0x' as Hex),
    value: BigInt(quote.transactionRequest.value ?? '0'),
    gas: quote.transactionRequest.gasLimit
      ? BigInt(quote.transactionRequest.gasLimit)
      : undefined,
    gasPrice: quote.transactionRequest.gasPrice
      ? BigInt(quote.transactionRequest.gasPrice)
      : undefined,
    maxFeePerGas: quote.transactionRequest.maxFeePerGas
      ? BigInt(quote.transactionRequest.maxFeePerGas)
      : undefined,
    maxPriorityFeePerGas: quote.transactionRequest.maxPriorityFeePerGas
      ? BigInt(quote.transactionRequest.maxPriorityFeePerGas)
      : undefined,
  })

  await waitForTransactionReceipt(config, {
    chainId,
    hash: txHash,
  })

  return txHash
}

export async function depositToVault(args: {
  quote: Pick<ComposerQuote, 'action' | 'estimate' | 'transactionRequest'>
  account: Address
  chainId: number
  config: ReturnType<typeof useConfig>
}) {
  return executeVaultQuote(args)
}

export async function withdrawFromVault(args: {
  quote: Pick<ComposerQuote, 'action' | 'estimate' | 'transactionRequest'>
  account: Address
  chainId: number
  config: ReturnType<typeof useConfig>
}) {
  return executeVaultQuote(args)
}
