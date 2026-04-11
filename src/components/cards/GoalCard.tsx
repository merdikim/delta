import type { Goal } from '#/types'
import type { FC } from 'react'

function formatGoalDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

const GoalCard: FC<{ goal: Goal }> = ({ goal }) => {
  return (
    <div className="w-full h-16 flex-none cursor-pointer font-semibold text-gray-700 flex items-center justify-between px-2 border-b-2 border-b-border hover:border-b-gray-300 hover:text-black">
      <span>{goal.name}</span>
      <span>{formatGoalDate(goal.createdAt)}</span>
    </div>
  )
}

export default GoalCard
