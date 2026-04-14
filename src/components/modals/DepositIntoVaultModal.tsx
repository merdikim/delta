import type { EarnVault, Goal } from '#/types'
import { formatUsd, SUPPORTED_ASSETS } from '#/utils'
import { X } from 'lucide-react'
import type { FormEvent } from 'react'

type FundingChainOption = {
  id: number
  label: string
  balance: bigint
  isAvailable: boolean
  isDestinationChain: boolean
}

type DepositIntoVaultModalProps = {
  goal: Goal
  vault?: EarnVault
  isOpen: boolean
  isPending: boolean
  hasSelectedVault: boolean
  depositAmount: string
  depositAmountNumber: number
  error?: string
  tokenSymbol: string
  tokenDecimals: number
  fundingChainOptions: FundingChainOption[]
  selectedFundingChainId: number
  onSelectFundingChain: (chainId: number) => void
  hasAnySupportedFundingChain: boolean
  hasSufficientFundsOnSelectedChain: boolean
  selectedFundingChainLabel: string
  selectedFundingChainBalance: bigint
  formatTokenBalance: (value: bigint | undefined, decimals: number) => string
  onClose: () => void
  onDepositAmountChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function DepositIntoVaultModal({
  goal,
  vault,
  isOpen,
  isPending,
  hasSelectedVault,
  depositAmount,
  depositAmountNumber,
  error,
  tokenSymbol,
  tokenDecimals,
  fundingChainOptions,
  selectedFundingChainId,
  onSelectFundingChain,
  hasAnySupportedFundingChain,
  hasSufficientFundsOnSelectedChain,
  selectedFundingChainLabel,
  selectedFundingChainBalance,
  formatTokenBalance,
  onClose,
  onDepositAmountChange,
  onSubmit,
}: DepositIntoVaultModalProps) {
  if (!isOpen) {
    return null
  }

  const destinationChainLabel =
    Object.values(SUPPORTED_ASSETS.networks).find(
      (network) => network.id === vault?.chainId,
    )?.label ??
    vault?.network ??
    'the goal vault chain'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-4xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Deposit towards your goal
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add more {tokenSymbol} to{' '}
              {vault?.name || goal.selectedVaultName || 'the selected vault'}{' '}
              for {goal.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close add position modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form className="mt-6" onSubmit={onSubmit}>
          <label className="mt-5 block">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Deposit amount
            </span>
            <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <span className="text-lg font-semibold text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(event) => onDepositAmountChange(event.target.value)}
                className="h-14 w-full bg-transparent px-3 text-lg font-semibold text-slate-950 outline-none"
                placeholder="50"
              />
            </div>
          </label>

          <div className="mt-4">
            Current amount : <b>{formatUsd(goal.currentAmount)}</b>
          </div>

          {depositAmountNumber > 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900">
              <p className="font-medium">Funding route</p>
              <p className="mt-1 leading-5 text-slate-600">
                Choose which chain to fund from. Delta will use LI.FI Composer
                to bridge and deposit in one flow when the source chain differs
                from {destinationChainLabel}.
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {fundingChainOptions.map((chain) => (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => onSelectFundingChain(chain.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      chain.id === selectedFundingChainId
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-950">
                      {chain.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Balance:{' '}
                      {formatTokenBalance(chain.balance, tokenDecimals)}{' '}
                      {tokenSymbol}
                    </p>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        chain.isAvailable ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {chain.isAvailable
                        ? chain.isDestinationChain
                          ? 'Direct deposit'
                          : 'Bridge + deposit'
                        : 'Insufficient balance'}
                    </p>
                  </button>
                ))}
              </div>

              {!hasAnySupportedFundingChain ? (
                <p className="mt-3 text-sm text-amber-800">
                  You need enough {tokenSymbol} on one supported chain to add
                  this deposit.
                </p>
              ) : !hasSufficientFundsOnSelectedChain ? (
                <p className="mt-3 text-sm text-amber-800">
                  {selectedFundingChainLabel} does not have enough {tokenSymbol}
                  {' '}for this deposit amount.
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Route: <span className="font-medium text-slate-900">{selectedFundingChainLabel}</span>{' '}
                  to <span className="font-medium text-slate-900">{destinationChainLabel}</span>.
                  {' '}Available balance:{' '}
                  {formatTokenBalance(selectedFundingChainBalance, tokenDecimals)} {tokenSymbol}.
                </p>
              )}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {!hasSelectedVault ? (
            <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This goal&apos;s vault could not be matched to a live deposit
              option.
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isPending ||
                !hasSelectedVault ||
                depositAmountNumber <= 0 ||
                !hasAnySupportedFundingChain ||
                !hasSufficientFundsOnSelectedChain
              }
              className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
