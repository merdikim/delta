import DepositIntoVaultModal from '#/components/modals/DepositIntoVaultModal'
import { addGoalDeposit, goalsQueryOptions } from '#/integrations/goals/goals'
import { getComposerQuote } from '#/integrations/lifi/composer'
import { depositToVault, earnPortfolioPositionsQueryOptions } from '#/integrations/lifi/earn'
import type { EarnPortfolioPosition, EarnVault, Goal } from '#/types'
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, formatDate, formatUsd, truncate } from '#/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Landmark, Plus, Wallet } from 'lucide-react'
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
  const [depositAmount, setDepositAmount] = useState('0')
  const currentAmount = goal?.currentAmount ?? 0
  const targetAmount = goal?.goalAmount ?? 0
  const chartWidth = 720
  const chartHeight = 240
  const paddingX = 22
  const paddingTop = 20
  const paddingBottom = 32
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingTop - paddingBottom
  const depositsAscending = [...(goal?.deposits ?? [])].reverse()
  const depositBars = depositsAscending.map((deposit, index) => ({
    ...deposit,
    cumulativeAmount: depositsAscending
      .slice(0, index + 1)
      .reduce((total, entry) => total + entry.amount, 0),
  }))
  const hasDepositsChart = depositBars.length > 0
  const peakBalance = Math.max(targetAmount, currentAmount, 1)
  const targetLineY =
    paddingTop + innerHeight - (targetAmount / peakBalance) * innerHeight
  const progressPercent =
    targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0

  const normalizedGoalProtocol = normalize(goal?.selectedProtocol)
  const normalizedVaultName = normalize(goal?.selectedVaultName)
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
  const chartLabel = hasDepositsChart
    ? `${goal?.deposits.length ?? 0} recorded deposit${goal?.deposits.length === 1 ? '' : 's'}`
    : 'No deposits recorded'
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

      const txHash = await depositToVault({
        quote,
        account: address,
        chainId: vault.chainId,
        config,
      })

      return addGoalDeposit({
        data: {
          // @ts-expect-error
          goalId: goal.id,
          walletAddress: address,
          amount: depositAmountNumber,
          txHash,
        },
      })
    },
    onSuccess: async () => {
      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
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
              Start with a target, track your current amount, and compare live
              protocol yields to see how quickly compounding can get you there.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden flex-1 lg:block">
      <DepositIntoVaultModal
        goal={goal}
        vault={vault}
        isOpen={isAddPositionModalOpen}
        isPending={addPositionMutation.isPending}
        hasSelectedVault={hasSelectedVault}
        depositAmount={depositAmount}
        depositAmountNumber={depositAmountNumber}
        error={
          addPositionMutation.error instanceof Error
            ? addPositionMutation.error.message
            : addPositionMutation.isError
              ? 'Unable to add the position right now.'
              : undefined
        }
        onClose={() => setIsAddPositionModalOpen(false)}
        onDepositAmountChange={setDepositAmount}
        onSubmit={(event) => void handleAddPosition(event)}
      />

      <div className="flex h-full rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
        <div className="flex w-full flex-col gap-6 p-6 xl:p-8">
          <div className="rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,245,249,0.84))] p-6 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
            <h3 className="truncate text-2xl font-semibold leading-tight text-slate-950">
              {goal.name}
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <StatCard label="Target amount" value={formatUsd(targetAmount)} />
              <StatCard
                label="Current amount"
                value={formatUsd(currentAmount)}
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
                    Deposit progress
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {chartLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Goal progress
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    {progressPercent.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.95))] p-4">
                {hasDepositsChart ? (
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-64 w-full"
                    role="img"
                    aria-label="Cumulative deposited amount compared with target amount"
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
                    {depositBars.map((deposit, index) => {
                      const columnWidth =
                        innerWidth / Math.max(depositBars.length, 1)
                      const barWidth = Math.max(columnWidth - 18, 18)
                      const x =
                        paddingX +
                        index * columnWidth +
                        (columnWidth - barWidth) / 2
                      const barHeight =
                        (deposit.cumulativeAmount / peakBalance) * innerHeight
                      const y = paddingTop + innerHeight - barHeight

                      return (
                        <g key={deposit.id}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(barHeight, 4)}
                            rx="10"
                            fill="#10b981"
                            opacity={index === depositBars.length - 1 ? '1' : '0.72'}
                          />
                          <text
                            x={x + barWidth / 2}
                            y={Math.max(y - 8, paddingTop)}
                            textAnchor="middle"
                            fill="#065f46"
                            fontSize="11"
                          >
                            {formatUsd(deposit.cumulativeAmount)}
                          </text>
                        </g>
                      )
                    })}
                    {depositBars.map((deposit, index) => {
                      const columnWidth =
                        innerWidth / Math.max(depositBars.length, 1)
                      const x = paddingX + index * columnWidth + columnWidth / 2

                      return (
                        <text
                          key={`${deposit.id}-label`}
                          x={x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="12"
                        >
                          {index + 1}
                        </text>
                      )
                    })}
                    <text
                      x={paddingX}
                      y={paddingTop + 12}
                      fill="#64748b"
                      fontSize="12"
                    >
                      Deposit #
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
                      No deposits recorded
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add deposits to this goal to see how funding is tracking
                      against the target amount.
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
                  {/* <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatUsd(totalPositionUsd)}
                  </p> */}
                </div>
                {/* <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Positions
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {displayedPositions.length}
                  </p>
                </div> */}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPositionModalOpen(true)
                  }}
                  className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasSelectedVault}
                >
                  <div>
                    <p className=" font-semibold text-slate-950">
                      Add amount
                    </p>
                  </div>
                  <div className="rounded-full bg-white p-2 text-emerald-700 shadow-sm">
                    <Plus className="size-4" />
                  </div>
                </button>
              </div>

              <div className="mt-5 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 border-b border-slate-200 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {goal.deposits.length > 0 ? (
                    goal.deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3"
                      >
                        <p className="text-sm text-slate-600">
                          {formatDate(deposit.createdAt, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-right text-sm font-semibold text-slate-950">
                          {formatUsd(deposit.amount)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No recorded deposits yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Deposits added to this goal will appear here with their
                        amounts and transaction hashes.
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
