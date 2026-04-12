import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const composerQuoteSchema = z.object({
  fromChain: z.number().int().positive(),
  toChain: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1).optional(),
  fromAmount: z.string().min(1),
})

export type ComposerQuote = {
  action: {
    fromChainId: number
    toChainId: number
    fromToken: {
      address: string
      symbol?: string
    }
    fromAmount: string
  }
  estimate: {
    approvalAddress?: string
  }
  transactionRequest: {
    to: string
    data?: `0x${string}`
    value?: string
    gasLimit?: string
    gasPrice?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    chainId?: number
  }
}

export const getComposerQuote = createServerFn({ method: 'POST' })
  .inputValidator((input) => composerQuoteSchema.parse(input))
  .handler(async ({ data }): Promise<ComposerQuote> => {
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
      let message = 'Failed to get LI.FI Composer quote'

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

    return (await response.json()) as ComposerQuote
  })
