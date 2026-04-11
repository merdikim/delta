import type { Goal } from '#/types'
import type { FC } from 'react'
import { formatUsd } from '#/utils'
import { ArrowUpRight, Coins, Target } from 'lucide-react'

function formatGoalDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

const GoalCard: FC<{ goal: Goal }> = ({ goal }) => {
  return (
    <article className="mb-2.5 rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {goal.name}
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Active
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="flex items-center gap-2 text-slate-500">
            <Target className="size-3" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
              Goal
            </span>
          </div>
          <p className="mt-1.5 text-base font-semibold text-slate-950">
            {formatUsd(goal.goalAmount)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="flex items-center gap-2 text-slate-500">
            <Coins className="size-3" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
              Monthly
            </span>
          </div>
          <p className="mt-1.5 text-base font-semibold text-slate-950">
            {formatUsd(goal.monthlyAmount)}
          </p>
        </div>
      </div>
    </article>
  )
}

export default GoalCard
