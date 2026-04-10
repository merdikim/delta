import Navbar from '#/components/Navbar'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Building2, Coins, Landmark, PiggyBank, TrendingUp } from 'lucide-react'

const bankRates = [
  {
    bank: 'Nova Bank',
    rate: '11.4%',
    term: '12-month savings lock',
    accent: 'from-emerald-500/20 to-teal-500/10',
    badge: 'Best return',
  },
  {
    bank: 'Crest Microfinance',
    rate: '9.8%',
    term: 'Flexible monthly top-ups',
    accent: 'from-sky-500/20 to-cyan-500/10',
    badge: 'Most flexible',
  },
  {
    bank: 'Harbor Capital',
    rate: '8.6%',
    term: 'Quarterly interest payout',
    accent: 'from-amber-500/20 to-orange-500/10',
    badge: 'Stable option',
  },
]

const NewGoalPage = () => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eefbf4_100%)] px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Navbar />

        <div className="grid gap-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                    <PiggyBank className="size-3.5" />
                    New Goal Setup
                  </div>

                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Create a goal with a target, a monthly plan, and a rate that
                    helps you get there faster.
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    Start by naming the goal and defining how much you want to
                    contribute. Then compare rates from a few banks before you
                    decide where your savings strategy should live.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-medium">Estimated setup time</p>
                  <p className="mt-1 text-2xl font-semibold">2 minutes</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Goal horizon
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    12 to 36 months
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Top up cadence
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Monthly deposits
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Best sample rate
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    11.4% APY
                  </p>
                </div>
              </div>
            </div>

            <Card className="rounded-[2rem] border-white/70 bg-white/80 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
                <CardTitle className="text-2xl text-slate-950">
                  Goal details
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  Fill in the three core numbers that shape your savings plan.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
                <form className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      Goal name
                    </span>
                    <input
                      type="text"
                      placeholder="Buy a new car"
                      className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        Monthly amount
                      </span>
                      <div className="flex h-13 items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="500"
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        Goal amount
                      </span>
                      <div className="flex h-13 items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="20000"
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="font-medium">Planning tip</p>
                        <p className="mt-1 leading-6">
                          Higher monthly deposits reduce the time it takes to hit
                          your target, while better rates increase how much your
                          balance can compound along the way.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      type="button"
                      size="lg"
                      className="h-12 rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800"
                    >
                      Save goal draft
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-2xl border-slate-300 bg-white px-6"
                    >
                      Compare rates first
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <Card className="rounded-[2rem] border-slate-900/5 bg-slate-950 py-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <Landmark className="size-5 text-emerald-300" />
                  Bank rates
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-300">
                  A quick scan of sample savings products you can compare while
                  setting up this goal.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
                {bankRates.map((bank) => (
                  <article
                    key={bank.bank}
                    className={`rounded-3xl border border-white/10 bg-gradient-to-br ${bank.accent} p-[1px]`}
                  >
                    <div className="rounded-[calc(1.5rem-1px)] bg-slate-950/90 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {bank.bank}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {bank.term}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          {bank.badge}
                        </span>
                      </div>

                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Interest rate
                          </p>
                          <p className="mt-2 text-3xl font-semibold text-emerald-300">
                            {bank.rate}
                          </p>
                        </div>
                        <Building2 className="size-10 text-white/40" />
                      </div>
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/70 bg-white/85 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <Coins className="size-5 text-emerald-700" />
                  Example projection
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Based on a monthly contribution of $500 and the highest sample
                  rate above.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estimated in 24 months</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    $13,401
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Your deposits</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      $12,000
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Interest earned</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                      $1,401
                    </p>
                  </div>
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
