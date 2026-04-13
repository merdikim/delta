import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { Link } from '@tanstack/react-router'
import {
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'
import tree_svg from "#/assets/tree.svg"
import SectionBadge from '#/components/cards/SectionBadge'

function StepCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-4xl flex flex-col items-center border border-white/70 bg-white/70 p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="inline-flex rounded-2xl bg-slate-950 p-1 text-emerald-300">
        {icon}
      </div>
      <h3 className="mt-1 font-semibold text-slate-950">{title}</h3>
      <p className=" text-sm leading-7 text-slate-600">{description}</p>
    </div>
  )
}

const LandingPage = () => {

  return (
    <main className="relative h-screen px-5 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <section className="p-8 lg:p-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full flex duration-700">
            <div>
              <SectionBadge badge={<Sparkles className="size-3.5" />} text='Plan the target, then let the yield do more work'/>

              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Your financial goals change from <span className='line-through decoration-3 decoration-destructive'>someday</span> to a <span className="text-emerald-600">funded plan</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Built for people who want their money to grow without lifting a finger.
                Set a target, deposit into a vault, and watch the progress, and
                projected growth in one place.
              </p>

              <div className="my-8">
                <Button asChild size="lg" className="w-87.5">
                  <Link to={'/connect'}>
                    Start your first goal
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden w-full items-center justify-center pl-8 lg:flex">
              <img src={tree_svg} alt="animated tree" />
            </div>
          </div>
          <div className="animate-in mt-8 fade-in slide-in-from-bottom-4 duration-700 lg:delay-150">
            <div className="relative grid gap-10 lg:grid-cols-3 lg:gap-4">
              <StepCard
                icon={<Target className="size-5" />}
                title="Define the finish line"
                description="Start with a dollar target and your current contribution."
              />
              <StepCard
                icon={<PiggyBank className="size-5" />}
                title="Fund with intention"
                description="Delta keeps the setup focused on capital you actually want working toward a goal."
              />
              <StepCard
                icon={<TrendingUp className="size-5" />}
                title="Track the compounding path"
                description="See how protocol APY, deposits, and portfolio value change the pace toward your next car, home fund, or travel stash."
              />
            </div>
          </div>
          <div className='w-full text-center mt-28'>
            <Button asChild size="lg" className='w-100'>
              <Link to={'/connect'}>
                Take the first step today
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LandingPage
