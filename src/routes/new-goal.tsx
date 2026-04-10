import NewGoalPage from '#/pages/NewGoalPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/new-goal')({
  component: NewGoal,
})

function NewGoal() {
  return <NewGoalPage/>
}
