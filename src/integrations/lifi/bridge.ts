import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const bridgeQuoteSchema = z.object({
  fromChain: z.number().int().positive(),
  toChain: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1).optional(),
  fromAmount: z.string().min(1),
})

export type LifiBridgeQuote = {
  tool?: string
  action: {
    fromChainId: number
    toChainId: number
    fromAmount: string
    fromToken: {
      address: string
      symbol?: string
      decimals?: number
    }
    toToken: {
      address: string
      symbol?: string
      decimals?: number
    }
  }
  estimate: {
    approvalAddress?: string
    toAmount?: string
    toAmountMin?: string
    executionDuration?: number
    feeCosts?: Array<{
      amount: string
      token?: {
        symbol?: string
        decimals?: number
      }
    }>
    gasCosts?: Array<{
      amount: string
      token?: {
        symbol?: string
        decimals?: number
      }
    }>
  }
  transactionRequest: {
    to: string
    data?: `0x${string}`
    value?: string
    gasLimit?: string
    gasPrice?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }
}

export const getBridgeQuote = createServerFn({ method: 'POST' })
  .inputValidator((input) => bridgeQuoteSchema.parse(input))
  .handler(async ({ data }): Promise<LifiBridgeQuote> => {
    const apiKey = process.env.LIFI_EARN_API_KEY
    const searchParams = new URLSearchParams({
      fromChain: String(data.fromChain),
      toChain: String(data.toChain),
      fromToken: data.fromToken,
      toToken: data.toToken,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress ?? data.fromAddress,
      fromAmount: data.fromAmount,
    })

    const response = await fetch(`https://li.quest/v1/quote?${searchParams}`, {
      headers: apiKey
        ? {
            'x-lifi-api-key': apiKey,
          }
        : undefined,
    })

    if (!response.ok) {
      let message = 'Failed to get LI.FI bridge quote'

      try {
        const error = (await response.json()) as { message?: string }
        if (error.message) {
          message = error.message
        }
      } catch {
        // Keep the default message if the error body is not JSON.
      }

      throw new Error(message)
    }

    return (await response.json()) as LifiBridgeQuote
  })
