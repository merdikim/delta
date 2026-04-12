import GoalCard from '#/components/cards/GoalCard'
import { goalsQueryOptions } from '#/integrations/goals/goals'
import Navbar from '#/components/Navbar'
import type { Goal } from '#/types'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useAccount } from 'wagmi'
import { cn } from '#/lib/utils'
import { ArrowRight, Goal as GoalIcon, Sparkles, Target } from 'lucide-react'

const HomePage = () => {
  const { address } = useAccount()
  const { data: goals = [] } = useQuery<Goal[]>({
    ...goalsQueryOptions(address ?? ''),
    enabled: Boolean(address),
  })

  return (
    <div className="h-screen w-screen px-6 lg:px-8">
      <Navbar />
      <div className="flex h-[calc(100vh-var(--navbar-height))] gap-6 py-4">
        <div className="flex w-full flex-col gap-4 lg:w-4/12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Goals</h2>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              {goals.length} active
            </span>
          </div>
          <div
            className={cn(
              goals.length === 0 ? 'flex-none' : 'flex-1',
              'flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur',
            )}
          >
            {goals.length ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-4xl bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <Sparkles className="size-3.5" />
                    Fresh start
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold leading-tight">
                    Your first goal can start with one small monthly step.
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Create a goal, choose a yield source, and let Delta show you
                    how your deposits can compound toward a target.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
                          <GoalIcon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Define the target
                          </p>
                          <p className="text-xs text-slate-400">
                            Name the goal and set your amount.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-sky-400/15 p-2 text-sky-300">
                          <Target className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Pick a live yield
                          </p>
                          <p className="text-xs text-slate-400">
                            Compare protocol APYs before you save.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/new-goal"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Create your first goal
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {goals.length ? (
            <Link
              to="/new-goal"
              className="flex h-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add New Goal
            </Link>
          ) : null}
        </div>

        <div className="hidden flex-1 lg:block">
          <div className="flex h-full items-center justify-center rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
            {goals.length ? (
              <div className="text-sm text-slate-500">
                Select a goal to see more detail.
              </div>
            ) : (
              <div className="max-w-xl px-8 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-700">
                  Goal planning
                </p>
                <h3 className="mt-4 text-4xl font-semibold leading-tight text-slate-950">
                  Turn a future purchase into a clear savings path.
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Start with a target, layer in monthly deposits, and compare live
                  protocol yields to see how quickly you can get there.
                </p>
                <Link
                    to="/new-goal"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Create your first goal
                    <ArrowRight className="size-4" />
                  </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
