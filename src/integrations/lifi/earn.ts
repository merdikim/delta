import type { ComposerQuote } from '#/integrations/lifi/composer'
import type { EarnVault, EarnVaultsResponse } from '#/types'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getPublicClient, sendTransaction, waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { erc20Abi, zeroAddress } from 'viem'
import type { Address, Hex } from 'viem'
import type { useConfig } from 'wagmi'

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

export async function depositToVault({
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
    //@ts-ignore
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
