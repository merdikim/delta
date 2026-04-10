import GoalCard from '#/components/cards/GoalCard'
import Navbar from '#/components/Navbar'
import type { Goal } from '#/types'
import { Link } from '@tanstack/react-router'

const mockGoals: Array<Goal> = Array(50).fill({
  name: 'Buy Porsche Cayenne',
  createdAt: 37396803689,
})

const HomePage = () => {
  return (
    <div className="h-screen w-screen px-8">
      <Navbar />
      <div className="h-[calc(100vh-var(--navbar-height))] flex">
        <div className='w-3/12 pt-4 pb-6 flex flex-col gap-4'>
          <h2 className='font-semibold text-xl'>Goals</h2>
          <div className="flex-1 flex flex-col overflow-scroll">
            {mockGoals.map((goal, index) => (
              <GoalCard key={index} goal={goal} />
            ))}
          </div>
          <Link to='/new-goal' className='h-8 bg-black text-white flex items-center justify-center rounded-sm'>Add New Goal</Link>
        </div>

        <div className='w-9/12'></div>
      </div>
    </div>
  )
}

export default HomePage
