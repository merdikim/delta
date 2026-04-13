import Navbar from '#/components/Navbar'
import Authenticated from '#/guards/authenticated'
import { earnVaultsQueryOptions } from '#/integrations/lifi/earn'
import NewGoalPage from '#/pages/NewGoalPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/new-goal')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(earnVaultsQueryOptions()),
  component: NewGoal,
})

function NewGoal() {
  return (
    <Authenticated>
      <Navbar/>
      <NewGoalPage />
    </Authenticated>
  )
}
