import Navbar from '#/components/Navbar'
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
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Coins, Landmark, TrendingUp } from 'lucide-react'
import type { EarnVault } from '#/types'
import { formatCompactUsd, formatPercent, formatUsd } from '#/utils'

const NewGoalPage = () => {
  const { data: vaults = [] } = useSuspenseQuery<EarnVault[]>(
    earnVaultsQueryOptions(),
  )
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  const [goalAmount, setGoalAmount] = useState('20000')
  const [selectedVaultIndex, setSelectedVaultIndex] = useState(0)

  const topVault = vaults[0]
  const selectedVault = vaults[selectedVaultIndex] ?? topVault
  const monthlyContribution = Number(monthlyAmount) || 0
  const targetAmount = Number(goalAmount) || 0
  const selectedApy = selectedVault?.analytics.apy.total ?? 0
  const monthlyRate = selectedApy / 100 / 12
  const projectionMonths = 24

  let projectedBalance = 0
  for (let month = 0; month < projectionMonths; month += 1) {
    projectedBalance =
      (projectedBalance + monthlyContribution) * (1 + monthlyRate)
  }

  const totalDeposits = monthlyContribution * projectionMonths
  const interestEarned = Math.max(projectedBalance - totalDeposits, 0)
  const progressToGoal =
    targetAmount > 0
      ? Math.min((projectedBalance / targetAmount) * 100, 100)
      : 0

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
                <form className="grid gap-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      Goal name
                    </span>
                    <input
                      type="text"
                      placeholder="Buy a new car"
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
                      type="button"
                      size="lg"
                      className="h-10 w-full rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                    >
                      Create Goal
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
                  Example projection
                </CardTitle>
                <CardDescription className="text-sm leading-5 text-slate-600">
                  Based on your monthly contribution and the selected protocol
                  yield over 24 months.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-sm text-slate-500">Estimated in 24 months</p>
                  <p className="mt-1.5 text-2xl font-semibold text-slate-950">
                    {formatUsd(projectedBalance)}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Using {selectedVault?.protocol.name ?? 'selected protocol'} at{' '}
                    {formatPercent(selectedApy)} APY
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-sm text-slate-500">Your deposits</p>
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
                    <p className="text-sm text-slate-500">Progress toward goal</p>
                    <p className="text-sm font-medium text-slate-900">
                      {progressToGoal.toFixed(0)}%
                    </p>
                  </div>
                  <div className="mt-2.5 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressToGoal}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-sm text-slate-600">
                    Target amount: {formatUsd(targetAmount)}
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
