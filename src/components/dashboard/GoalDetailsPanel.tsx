import { getComposerQuote } from '#/integrations/lifi/composer'
import { depositToVault, earnPortfolioPositionsQueryOptions } from '#/integrations/lifi/earn'
import type { EarnPortfolioPosition, EarnVault, Goal } from '#/types'
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, formatDate, formatUsd, truncate } from '#/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Landmark, Plus, Wallet, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { switchChain } from '@wagmi/core'
import { parseUnits } from 'viem'
import { useAccount, useConfig } from 'wagmi'

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function normalize(value?: string) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export default function GoalDetailsPanel({
  goal,
  positions = [],
  yieldPercent = 0,
  vault,
}: {
  goal?: Goal
  positions?: EarnPortfolioPosition[]
  yieldPercent?: number
  vault?: EarnVault
}) {
  const queryClient = useQueryClient()
  const config = useConfig()
  const { address, chainId } = useAccount()
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState(
    goal?.monthlyAmount ? String(goal.monthlyAmount) : '500',
  )

  if (!goal) {
    return (
      <div className="hidden flex-1 lg:block">
        <div className="flex h-full items-center justify-center rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="max-w-xl px-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-700">
              Goal planning
            </p>
            <h3 className="mt-4 text-4xl font-semibold leading-tight text-slate-950">
              Turn a future purchase into a clear savings path.
            </h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Start with a target, add your initial funding, and compare live
              protocol yields to see how quickly compounding can get you there.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const initialContribution = goal.monthlyAmount
  const targetAmount = goal.goalAmount
  const monthlyRate = yieldPercent / 100 / 12
  const chartWidth = 720
  const chartHeight = 240
  const paddingX = 22
  const paddingTop = 20
  const paddingBottom = 32
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingTop - paddingBottom

  const projectionPoints: Array<{ month: number; balance: number }> = []
  let projectedBalance = initialContribution
  let monthsToGoal = 0
  const maxProjectionMonths = 600

  if (initialContribution > 0 && targetAmount > 0) {
    projectionPoints.push({ month: 0, balance: initialContribution })
  }

  while (
    projectedBalance < targetAmount &&
    monthsToGoal < maxProjectionMonths &&
    initialContribution > 0 &&
    targetAmount > 0
  ) {
    projectedBalance = projectedBalance * (1 + monthlyRate)
    monthsToGoal += 1
    projectionPoints.push({ month: monthsToGoal, balance: projectedBalance })
  }

  const hasProjection = projectionPoints.length > 0
  const peakBalance = Math.max(
    targetAmount,
    projectedBalance,
    initialContribution,
    1,
  )
  const chartPath = hasProjection
    ? projectionPoints
        .map((point, index) => {
          const x =
            paddingX + (point.month / Math.max(monthsToGoal, 1)) * innerWidth
          const y =
            paddingTop +
            innerHeight -
            (point.balance / peakBalance) * innerHeight

          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
        })
        .join(' ')
    : ''
  const finalProjectedBalance = projectedBalance
  const targetLineY =
    paddingTop + innerHeight - (targetAmount / peakBalance) * innerHeight

  const normalizedGoalProtocol = normalize(goal.selectedProtocol)
  const normalizedVaultName = normalize(goal.selectedVaultName)
  const matchingPositions = positions.filter((position) => {
    const normalizedProtocol = normalize(position.protocolName)
    const normalizedAssetName = normalize(position.asset.name)
    const normalizedAssetSymbol = normalize(position.asset.symbol)

    const protocolMatches = normalizedGoalProtocol
      ? normalizedProtocol === normalizedGoalProtocol
      : false
    const assetMatches = normalizedVaultName
      ? normalizedAssetName === normalizedVaultName ||
        normalizedAssetSymbol === normalizedVaultName ||
        normalizedAssetName?.includes(normalizedVaultName) ||
        normalizedVaultName.includes(normalizedAssetName ?? '')
      : false

    return protocolMatches || assetMatches
  })

  const displayedPositions =
    matchingPositions.length > 0 ? matchingPositions : positions
  const totalPositionUsd = displayedPositions.reduce(
    (total, position) => total + Number(position.balanceUsd || 0),
    0,
  )
  const remainingToTarget = Math.max(targetAmount - totalPositionUsd, 0)
  const chartLabel = hasProjection
    ? monthsToGoal === 0
      ? 'Target reached immediately'
      : `${monthsToGoal} months to target`
    : 'Projection unavailable'
  const positionsLabel =
    matchingPositions.length > 0 ? 'Vault positions' : 'Wallet positions'
  const hasSelectedVault = Boolean(vault)
  const depositAmountNumber = Number(depositAmount) || 0

  const addPositionMutation = useMutation({
    mutationFn: async () => {
      if (!address || !vault) {
        throw new Error('Wallet or vault missing')
      }

      const fromAmount = parseUnits(depositAmount, 6).toString()

      const quote = await getComposerQuote({
        data: {
          fromChain: BASE_CHAIN_ID,
          toChain: vault.chainId,
          fromToken: BASE_USDC_ADDRESS,
          toToken: vault.address,
          fromAddress: address,
          toAddress: address,
          fromAmount,
        },
      })

      if (chainId !== vault.chainId) {
        await switchChain(config, { chainId: vault.chainId })
      }

      await depositToVault({
        quote,
        account: address,
        chainId: vault.chainId,
        config,
      })
    },
    onSuccess: async () => {
      if (address) {
        await queryClient.invalidateQueries(
          earnPortfolioPositionsQueryOptions(address),
        )
      }

      setIsAddPositionModalOpen(false)
    },
  })

  const handleAddPosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      addPositionMutation.isPending ||
      !address ||
      !vault ||
      depositAmountNumber <= 0
    ) {
      return
    }

    await addPositionMutation.mutateAsync()
  }

  return (
    <div className="hidden flex-1 lg:block">
      {isAddPositionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                  Add position
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Deposit into this vault
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add more USDC to {vault?.name || goal.selectedVaultName || 'the selected vault'} for {goal.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPositionModalOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close add position modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form className="mt-6" onSubmit={(event) => void handleAddPosition(event)}>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                  Selected vault
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {vault?.name || goal.selectedVaultName || 'Unavailable'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {vault
                    ? `${vault.protocol.name} · ${vault.analytics.apy.total.toFixed(2)}% APY`
                    : 'This goal does not have a live vault attached right now.'}
                </p>
              </div>

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
                    onChange={(event) => setDepositAmount(event.target.value)}
                    className="h-14 w-full bg-transparent px-3 text-lg font-semibold text-slate-950 outline-none"
                    placeholder="500"
                  />
                </div>
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Suggested payment
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {formatUsd(goal.monthlyAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Wallet
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {truncate(goal.walletAddress, 6)}
                  </p>
                </div>
              </div>

              {addPositionMutation.isError ? (
                <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {addPositionMutation.error instanceof Error
                    ? addPositionMutation.error.message
                    : 'Unable to add the position right now.'}
                </p>
              ) : null}

              {!hasSelectedVault ? (
                <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This goal&apos;s vault could not be matched to a live deposit option.
                </p>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPositionModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    addPositionMutation.isPending ||
                    !hasSelectedVault ||
                    !address ||
                    depositAmountNumber <= 0
                  }
                  className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {addPositionMutation.isPending ? 'Depositing...' : 'Add position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="flex h-full rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
        <div className="flex w-full flex-col gap-6 p-6 xl:p-8">
          <div className="rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,245,249,0.84))] p-6 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
            <h3 className="truncate text-2xl font-semibold leading-tight text-slate-950">
              {goal.name}
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <StatCard label="Target amount" value={formatUsd(targetAmount)} />
              <StatCard
                label="Initial amount"
                value={formatUsd(initialContribution)}
              />
              <StatCard
                label="Yield source"
                value={`${yieldPercent.toFixed(2)}% APY`}
              />
              <StatCard
                label="Tracked value"
                value={formatUsd(totalPositionUsd)}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <Wallet className="size-3.5" />
                {truncate(goal.walletAddress, 6)}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <CalendarDays className="size-3.5" />
                Created {formatDate(goal.createdAt)}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <Landmark className="size-3.5" />
                Remaining {formatUsd(remainingToTarget)}
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <section className="rounded-4xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Growth projection
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {chartLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Projected balance
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    {formatUsd(finalProjectedBalance)}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.95))] p-4">
                {hasProjection ? (
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-64 w-full"
                    role="img"
                    aria-label="Projected balance growth toward target amount"
                  >
                    <line
                      x1={paddingX}
                      y1={paddingTop + innerHeight}
                      x2={paddingX + innerWidth}
                      y2={paddingTop + innerHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={paddingX}
                      y1={paddingTop}
                      x2={paddingX}
                      y2={paddingTop + innerHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={paddingX}
                      y1={targetLineY}
                      x2={paddingX + innerWidth}
                      y2={targetLineY}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="6 6"
                    />
                    <path
                      d={chartPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {projectionPoints.map((point, index) => {
                      if (
                        index !== 0 &&
                        index !== projectionPoints.length - 1 &&
                        index !== Math.floor(projectionPoints.length / 2)
                      ) {
                        return null
                      }

                      const x =
                        paddingX +
                        (point.month / Math.max(monthsToGoal, 1)) * innerWidth
                      const y =
                        paddingTop +
                        innerHeight -
                        (point.balance / peakBalance) * innerHeight

                      return (
                        <circle
                          key={point.month}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="3"
                        />
                      )
                    })}
                    <text
                      x={paddingX}
                      y={chartHeight - 8}
                      fill="#64748b"
                      fontSize="12"
                    >
                      Start
                    </text>
                    <text
                      x={paddingX + innerWidth}
                      y={chartHeight - 8}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="12"
                    >
                      {monthsToGoal === 0 ? 'Now' : `Month ${monthsToGoal}`}
                    </text>
                    <text
                      x={paddingX + innerWidth - 4}
                      y={targetLineY - 8}
                      textAnchor="end"
                      fill="#b45309"
                      fontSize="12"
                    >
                      Target {formatUsd(targetAmount)}
                    </text>
                  </svg>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <p className="text-base font-medium text-slate-700">
                      Projection unavailable
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add an initial amount and target amount to see how this
                      goal compounds over time.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="flex flex-col rounded-4xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {positionsLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatUsd(totalPositionUsd)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Positions
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {displayedPositions.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Remaining to target
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatUsd(remainingToTarget)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Selected vault
                  </p>
                  <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                    {goal.selectedVaultName || 'Not selected'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDepositAmount(String(goal.monthlyAmount))
                    setIsAddPositionModalOpen(true)
                  }}
                  className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasSelectedVault}
                >
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                      Vault action
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      Add position
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Deposit more USDC into this goal&apos;s selected vault.
                    </p>
                  </div>
                  <div className="rounded-full bg-white p-2 text-emerald-700 shadow-sm">
                    <Plus className="size-4" />
                  </div>
                </button>
              </div>

              <div className="mt-5 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  <span>Asset</span>
                  <span>Value</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {displayedPositions.length > 0 ? (
                    displayedPositions.map((position) => (
                      <div
                        key={`${position.chainId}-${position.protocolName}-${position.asset.address}`}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {position.asset.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {position.asset.symbol} on chain {position.chainId} ·{' '}
                            {position.protocolName}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-950">
                          {formatUsd(Number(position.balanceUsd))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No LI.FI Earn positions found
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Once this wallet has a position, it will show up here
                        automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
