import type { EarnVault, Goal } from '#/types'
import { formatUsd } from '#/utils'
import { AlertTriangle, ArrowRightLeft, Trash2, Wallet, X } from 'lucide-react'

const GOAL_DELETION_BALANCE_THRESHOLD = 0.09

type ChainOption = {
  id: number
  label: string
}

type DeleteGoalModalProps = {
  goal?: Goal | null
  vault?: EarnVault
  isOpen: boolean
  isDeleting: boolean
  isWithdrawing: boolean
  withdrawAmount: string
  withdrawAmountNumber: number
  withdrawError?: string
  destinationChainOptions: ChainOption[]
  selectedDestinationChainId: number
  onSelectDestinationChain: (chainId: number) => void
  onWithdrawAmountChange: (value: string) => void
  onClose: () => void
  onConfirmDelete: (goal: Goal) => void
  onWithdraw: () => void
}

export default function DeleteGoalModal({
  goal,
  vault,
  isOpen,
  isDeleting,
  isWithdrawing,
  withdrawAmount,
  withdrawAmountNumber,
  withdrawError,
  destinationChainOptions,
  selectedDestinationChainId,
  onSelectDestinationChain,
  onWithdrawAmountChange,
  onClose,
  onConfirmDelete,
  onWithdraw,
}: DeleteGoalModalProps) {
  if (!isOpen || !goal) {
    return null
  }

  const requiresWithdrawal =
    goal.currentAmount >= GOAL_DELETION_BALANCE_THRESHOLD
  //const hasMatchedVault = Boolean(vault)
  //const canWithdrawFromVault = Boolean(vault?.isRedeemable)
  const isWithdrawAmountValid =
    withdrawAmountNumber > 0 && withdrawAmountNumber <= goal.currentAmount
  const withdrawTokenSymbol =
    vault?.underlyingTokens[0]?.symbol.toUpperCase() ?? 'the underlying token'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-4xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`inline-flex size-12 items-center justify-center rounded-full ${
              requiresWithdrawal
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {requiresWithdrawal ? (
              <Wallet className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close delete goal modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <h3 className="mt-5 text-2xl font-semibold text-slate-950">
          {requiresWithdrawal ? 'Withdraw before deleting' : 'Delete this goal?'}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {requiresWithdrawal ? (
            <>
              <span className="font-medium text-slate-950">{goal.name}</span>{' '}
              still has {formatUsd(goal.currentAmount)} tracked in it. Withdraw
              the balance below $0.09 first, then you can safely remove the
              goal.
            </>
          ) : (
            <>
              This will permanently remove{' '}
              <span className="font-medium text-slate-950">{goal.name}</span>{' '}
              from your dashboard.
            </>
          )}
        </p>

        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            requiresWithdrawal
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-rose-100 bg-rose-50 text-rose-800'
          }`}
        >
          {requiresWithdrawal
            ? 'The withdrawal uses the linked vault as the source and returns the underlying asset back to your wallet.'
            : 'You can’t undo this after the goal is deleted.'}
        </div>

        {requiresWithdrawal ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">
                  Available to withdraw
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  {formatUsd(goal.currentAmount)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Delta will redeem from{' '}
                <span className="font-medium text-slate-950">
                  {vault?.name ?? goal.selectedVaultName ?? 'the linked vault'}
                </span>{' '}
                and send back {withdrawTokenSymbol}.
              </p>
            </div>

            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Withdraw amount
              </span>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <span className="text-lg font-semibold text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  max={goal.currentAmount}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(event) => onWithdrawAmountChange(event.target.value)}
                  className="h-14 w-full bg-transparent px-3 text-lg font-semibold text-slate-950 outline-none"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => onWithdrawAmountChange(goal.currentAmount.toFixed(2))}
                  className="rounded-full bg-slate-200 px-3 py-1 w-32 text-xs font-medium text-slate-700 transition hover:bg-slate-300"
                >
                  Max
                </button>
              </div>
            </label>

            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Receive on
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {destinationChainOptions.map((chain) => (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => onSelectDestinationChain(chain.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      chain.id === selectedDestinationChainId
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-950">
                      {chain.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {vault?.chainId === chain.id
                        ? 'Direct redeem'
                        : 'Redeem + bridge'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* {!hasMatchedVault ? (
              <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Delta couldn&apos;t match this goal to a live vault withdrawal
                route yet.
              </p>
            ) : !canWithdrawFromVault ? (
              <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This vault does not currently expose a redeemable withdrawal
                path.
              </p>
            ) : !isWithdrawAmountValid ? (
              <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Enter an amount greater than $0 and no more than the remaining
                tracked balance.
              </p>
            ) : null} */}

            {withdrawError ? (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {withdrawError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {requiresWithdrawal ? 'Close' : 'Cancel'}
          </button>
          {requiresWithdrawal ? (
            <button
              type="button"
              onClick={onWithdraw}
              disabled={
                isWithdrawing ||
                // !hasMatchedVault ||
                // !canWithdrawFromVault ||
                !isWithdrawAmountValid
              }
              className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowRightLeft className="size-4" />
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onConfirmDelete(goal)}
              disabled={isDeleting}
              className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="size-4" />
                {isDeleting ? 'Deleting...' : 'Delete goal'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
