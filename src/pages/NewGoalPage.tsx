import Navbar from '#/components/Navbar'
import { createGoal, goalsQueryOptions } from '#/integrations/goals/goals'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  earnVaultsQueryOptions,
} from '#/integrations/lifi/earn'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Coins, Landmark, TrendingUp } from 'lucide-react'
import type { EarnVault } from '#/types'
import { formatCompactUsd, formatPercent, formatUsd } from '#/utils'
import { useNavigate } from '@tanstack/react-router'
import { useAccount } from 'wagmi'

const NewGoalPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address } = useAccount()
  const { data: vaults = [] } = useSuspenseQuery<EarnVault[]>(
    earnVaultsQueryOptions(),
  )
  const [goalName, setGoalName] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  const [goalAmount, setGoalAmount] = useState('20000')
  const [selectedVaultIndex, setSelectedVaultIndex] = useState(0)

  const topVault = vaults[0]
  const selectedVault = vaults[selectedVaultIndex] ?? topVault
  const monthlyContribution = Number(monthlyAmount) || 0
  const targetAmount = Number(goalAmount) || 0
  const selectedApy = selectedVault?.analytics.apy.total ?? 0
  const monthlyRate = selectedApy / 100 / 12
  const hasMonthlyAmountError =
    monthlyContribution > 0 &&
    targetAmount > 0 &&
    monthlyContribution > targetAmount

  let projectedBalance = 0
  let monthsToGoal = 0
  const maxProjectionMonths = 600

  while (
    projectedBalance < targetAmount &&
    monthsToGoal < maxProjectionMonths &&
    monthlyContribution > 0 &&
    targetAmount > 0
  ) {
    projectedBalance =
      (projectedBalance + monthlyContribution) * (1 + monthlyRate)
    monthsToGoal += 1
  }

  const hasReachableProjection =
    targetAmount > 0 &&
    monthlyContribution > 0 &&
    !hasMonthlyAmountError &&
    projectedBalance >= targetAmount

  const totalDeposits = monthlyContribution * monthsToGoal
  const interestEarned = Math.max(projectedBalance - totalDeposits, 0)
  const yearsToGoal = monthsToGoal / 12

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!address || !selectedVault) {
        throw new Error('Wallet or vault missing')
      }

      return createGoal({
        data: {
          walletAddress: address,
          name: goalName.trim(),
          monthlyAmount: monthlyContribution,
          goalAmount: targetAmount,
          selectedVaultName: selectedVault.name,
          selectedProtocol: selectedVault.protocol.name,
        },
      })
    },
    onSuccess: async () => {
      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
      }

      await navigate({ to: '/home' })
    },
  })

  const handleCreateGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      createGoalMutation.isPending ||
      !address ||
      !goalName.trim() ||
      monthlyContribution <= 0 ||
      targetAmount <= 0 ||
      hasMonthlyAmountError
    ) {
      return
    }

    await createGoalMutation.mutateAsync()
  }

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eefbf4_100%)] px-4 sm:px-5 lg:px-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <Navbar />

        <div className="grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="min-h-0 space-y-4">
            <Card className="rounded-3xl border-white/70 bg-white/80 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardTitle className="text-xl text-slate-950">
                  Goal details
                </CardTitle>
                <CardDescription className="text-sm leading-5 text-slate-600">
                  Fill in the three core numbers that shape your savings plan.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <form className="grid gap-4" onSubmit={handleCreateGoal}>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      Goal name
                    </span>
                    <input
                      type="text"
                      placeholder="Buy a new car"
                      value={goalName}
                      onChange={(event) => setGoalName(event.target.value)}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-800">
                        Monthly amount
                      </span>
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="500"
                          value={monthlyAmount}
                          onChange={(event) => setMonthlyAmount(event.target.value)}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-800">
                        Goal amount
                      </span>
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="20000"
                          value={goalAmount}
                          onChange={(event) => setGoalAmount(event.target.value)}
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  {hasMonthlyAmountError ? (
                    <p className="text-sm font-medium text-red-600">
                      Monthly amount cannot be greater than goal amount.
                    </p>
                  ) : null}

                  {createGoalMutation.isError ? (
                    <p className="text-sm font-medium text-red-600">
                      {createGoalMutation.error instanceof Error
                        ? createGoalMutation.error.message
                        : 'Unable to create goal right now.'}
                    </p>
                  ) : null}

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-emerald-900">
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-medium">Planning tip</p>
                        <p className="mt-1 leading-5">
                          Higher monthly deposits reduce the time it takes to hit
                          your target, while better rates increase how much your
                          balance can compound along the way.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-10 w-full rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                      disabled={
                        createGoalMutation.isPending ||
                        !address ||
                        !goalName.trim() ||
                        monthlyContribution <= 0 ||
                        targetAmount <= 0 ||
                        hasMonthlyAmountError
                      }
                    >
                      {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="min-h-0 space-y-4">
            <Card className="rounded-3xl border-slate-900/5 bg-slate-950 py-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <Landmark className="size-4 text-emerald-300" />
                  Protocol yields
                </CardTitle>
                <CardDescription className="text-sm leading-5 text-slate-300">
                  Live vault data from LI.FI Earn for Base USDC, sorted by total
                  APY.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                {vaults.map((vault, index) => (
                  <button
                    key={`${vault.protocol.name}-${vault.name}-${index}`}
                    type="button"
                    onClick={() => setSelectedVaultIndex(index)}
                    className={`h-20 rounded-2xl border text-left transition ${
                      index === selectedVaultIndex
                        ? 'border-emerald-300 bg-white/5'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex h-full items-center justify-between gap-3 rounded-[calc(1rem-1px)] bg-slate-950/90 px-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="shrink-0 text-sm font-semibold text-white">
                            {vault.protocol.name}
                          </p>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                            TVL {formatCompactUsd(vault.analytics.tvl.usd)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-300">
                          {vault.name} • {vault.underlyingTokens[0]?.symbol} •{' '}
                          {vault.network}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            APY
                          </p>
                          <p className="text-lg font-semibold text-emerald-300">
                            {formatPercent(vault.analytics.apy.total)}
                          </p>
                        </div>
                        <div className="text-right text-[10px] leading-4 text-slate-300">
                          <p>
                            Base {formatPercent(vault.analytics.apy.base)}
                          </p>
                          <p>
                            Reward {formatPercent(vault.analytics.apy.reward)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/70 bg-white/85 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <Coins className="size-4 text-emerald-700" />
                  Time to goal
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-sm text-slate-500">Estimated time to goal</p>
                  <p className="mt-1.5 text-2xl font-semibold text-slate-950">
                    {hasReachableProjection ? `${monthsToGoal} months` : '--'}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Using {selectedVault?.protocol.name ?? 'selected protocol'} at{' '}
                    {formatPercent(selectedApy)} APY
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-sm text-slate-500">Estimated deposits</p>
                    <p className="mt-1.5 text-lg font-semibold text-slate-900">
                      {formatUsd(totalDeposits)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-sm text-slate-500">Interest earned</p>
                    <p className="mt-1.5 text-lg font-semibold text-emerald-700">
                      {formatUsd(interestEarned)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">Time in years</p>
                    <p className="text-sm font-medium text-slate-900">
                      {hasReachableProjection ? yearsToGoal.toFixed(1) : '--'}
                    </p>
                  </div>
                  <p className="mt-2.5 text-sm text-slate-600">
                    Target amount: {formatUsd(targetAmount)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {hasReachableProjection
                      ? `Projected balance at goal month: ${formatUsd(projectedBalance)}`
                      : 'Enter a valid monthly amount and goal amount to see the estimate.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}

export default NewGoalPage
