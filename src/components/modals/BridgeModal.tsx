import { Button } from '#/components/ui/button'
import { X } from 'lucide-react'

type BridgeChainOption = {
  id: number
  label: string
}

type BridgeEstimateToken = {
  symbol?: string
  decimals?: number
}

type BridgeFeeCost = {
  amount: string
  token?: BridgeEstimateToken
}

type BridgeQuoteView = {
  tool?: string
  action: {
    fromAmount: string
    fromToken: {
      symbol?: string
      decimals?: number
    }
    toToken: {
      symbol?: string
      decimals?: number
    }
  }
  estimate: {
    toAmount?: string
    toAmountMin?: string
    executionDuration?: number
  }
}

function formatExecutionDuration(seconds?: number) {
  if (!seconds || seconds <= 0) {
    return '--'
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)} sec`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.ceil(seconds % 60)

  if (remainingSeconds === 60) {
    return `${minutes + 1} min`
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`
  }

  return `${minutes} min ${remainingSeconds} sec`
}

type BridgeModalProps = {
  isOpen: boolean
  onClose: () => void
  amountNeeded: bigint
  currentDestinationBalance?: bigint
  tokenSymbol: string
  tokenDecimals: number
  destinationChainLabel: string
  formatTokenBalance: (value: bigint | undefined, decimals: number) => string
  chainOptions: BridgeChainOption[]
  selectedChainId: number
  onSelectChain: (chainId: number) => void
  selectedChainLabel: string
  isWalletOnSelectedChain: boolean
  quote?: BridgeQuoteView
  isQuoteLoading: boolean
  quoteError?: string
  bridgeFeeAmount?: BridgeFeeCost
  bridgeGasAmount?: BridgeFeeCost
  bridgeError?: string
  isBridgePending: boolean
  onConfirmBridge: () => void
}

export default function BridgeModal({
  isOpen,
  onClose,
  amountNeeded,
  currentDestinationBalance,
  tokenSymbol,
  tokenDecimals,
  destinationChainLabel,
  formatTokenBalance,
  chainOptions,
  selectedChainId,
  onSelectChain,
  selectedChainLabel,
  isWalletOnSelectedChain,
  quote,
  isQuoteLoading,
  quoteError,
  bridgeFeeAmount,
  bridgeGasAmount,
  bridgeError,
  isBridgePending,
  onConfirmBridge,
}: BridgeModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-4xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Bridge to {destinationChainLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">
                Amount needed on {destinationChainLabel}
              </span>
              <span className="text-lg font-semibold text-slate-950">
                {formatTokenBalance(amountNeeded, tokenDecimals)} {tokenSymbol}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Current {destinationChainLabel} balance:{' '}
              {formatTokenBalance(currentDestinationBalance, tokenDecimals)}{' '}
              {tokenSymbol}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Bridge from</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {chainOptions.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => onSelectChain(chain.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    selectedChainId === chain.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-950">
                    {chain.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tokenSymbol} to {destinationChainLabel}
                  </p>
                </button>
              ))}
            </div>
            {!isWalletOnSelectedChain ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <p className="font-medium">
                  Wallet needs to switch to {selectedChainLabel}
                </p>
                <p className="mt-1 leading-5">
                  The bridge transaction will prompt a network switch before it
                  starts.
                </p>
              </div>
            ) : null}
          </div>

          {isQuoteLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              Loading live bridge details from LI.FI...
            </div>
          ) : quoteError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {quoteError}
            </div>
          ) : quote ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Route</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">
                    {selectedChainLabel} to {destinationChainLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Send{' '}
                    {formatTokenBalance(
                      BigInt(quote.action.fromAmount),
                      quote.action.fromToken.decimals ?? 6,
                    )}{' '}
                    {quote.action.fromToken.symbol ?? 'USDC'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Provider: {quote.tool ?? 'LI.FI'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Estimated received</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">
                    {formatTokenBalance(
                      quote.estimate.toAmount
                        ? BigInt(quote.estimate.toAmount)
                        : undefined,
                      quote.action.toToken.decimals ?? 6,
                    )}{' '}
                    {quote.action.toToken.symbol ?? 'USDC'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Minimum:{' '}
                    {formatTokenBalance(
                      quote.estimate.toAmountMin
                        ? BigInt(quote.estimate.toAmountMin)
                        : undefined,
                      quote.action.toToken.decimals ?? 6,
                    )}{' '}
                    {quote.action.toToken.symbol ?? 'USDC'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">Bridge fee</span>
                  <span className="text-sm font-medium text-slate-900">
                    {bridgeFeeAmount
                      ? `${formatTokenBalance(
                          BigInt(bridgeFeeAmount.amount),
                          bridgeFeeAmount.token?.decimals ?? 6,
                        )} ${bridgeFeeAmount.token?.symbol ?? ''}`.trim()
                      : '--'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">Estimated gas</span>
                  <span className="text-sm font-medium text-slate-900">
                    {bridgeGasAmount
                      ? `${formatTokenBalance(
                          BigInt(bridgeGasAmount.amount),
                          bridgeGasAmount.token?.decimals ?? 18,
                        )} ${bridgeGasAmount.token?.symbol ?? ''}`.trim()
                      : '--'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">Estimated time</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatExecutionDuration(quote.estimate.executionDuration)}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-500">
                This sends a LI.FI bridge transaction from your current chain.
                Arrival on Base may take a little time after the source
                transaction confirms.
              </p>
            </>
          ) : null}
        </div>

        {bridgeError ? (
          <p className="mt-4 text-sm font-medium text-red-600">{bridgeError}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            className="sm:flex-1"
            disabled={isBridgePending || !quote}
            onClick={onConfirmBridge}
          >
            {isBridgePending ? 'Bridging with LI.FI...' : 'Bridge with LI.FI'}
          </Button>
        </div>
      </div>
    </div>
  )
}
