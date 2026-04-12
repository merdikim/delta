import type { Goal } from '#/types'
import type { FC } from 'react'
import { formatUsd } from '#/utils'
import { Coins, Target, Trash2 } from 'lucide-react'

const GoalCard: FC<{
  goal: Goal
  isSelected?: boolean
  onClick?: () => void
  onDelete?: (goal: Goal) => void
  isDeleting?: boolean
}> = ({ goal, isSelected = false, onClick, onDelete, isDeleting = false }) => {
  return (
    <div
      className={`group relative mb-2.5 w-full rounded-[1.4rem] border shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)] ${
        isSelected
          ? 'border-emerald-300'
          : 'border-slate-200/80 bg-white/85 hover:border-emerald-200'
      }`}
    >
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${goal.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(goal)
          }}
          disabled={isDeleting}
          className={`absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 disabled:cursor-not-allowed disabled:opacity-60 ${
            isSelected ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-[1.4rem] p-3 pr-12 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {goal.name}
            </p>
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
                Current
              </span>
            </div>
            <p className="mt-1.5 text-base font-semibold text-slate-950">
              {formatUsd(goal.currentAmount)}
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}

export default GoalCard
