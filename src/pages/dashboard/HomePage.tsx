import GoalDetailsPanel from '#/components/dashboard/GoalDetailsPanel'
import GoalCard from '#/components/cards/GoalCard'
import { deleteGoal, goalsQueryOptions } from '#/integrations/goals/goals'
import {
  earnPortfolioPositionsQueryOptions,
  earnVaultsQueryOptions,
} from '#/integrations/lifi/earn'
import type { EarnPortfolioPosition, EarnVault, Goal } from '#/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { cn } from '#/lib/utils'
import { ArrowRight, Goal as GoalIcon, Sparkles, Target } from 'lucide-react'
import SectionBadge from '#/components/cards/SectionBadge'

function normalize(value?: string) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function GoalCardSkeleton() {
  return (
    <div className="mb-2.5 w-full animate-pulse rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="h-4 w-32 rounded-full bg-slate-200" />
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="h-3 w-14 rounded-full bg-slate-200" />
          <div className="mt-2 h-5 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="h-3 w-16 rounded-full bg-slate-200" />
          <div className="mt-2 h-5 w-20 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  )
}

const HomePage = () => {
  const queryClient = useQueryClient()
  const { address } = useAccount()
  const { data: goals = [], isPending: isGoalsLoading } = useQuery<Goal[]>({
    ...goalsQueryOptions(address ?? ''),
    enabled: Boolean(address),
  })
  const { data: vaults = [] } = useQuery<EarnVault[]>(earnVaultsQueryOptions())
  const { data: portfolioPositions = [] } = useQuery<EarnPortfolioPosition[]>({
    ...earnPortfolioPositionsQueryOptions(address ?? ''),
    enabled: Boolean(address),
  })
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!address) {
        throw new Error('Wallet missing')
      }

      return deleteGoal({
        data: {
          id: goalId,
          walletAddress: address,
        },
      })
    },
    onSuccess: async (_, goalId) => {
      if (selectedGoalId === goalId) {
        setSelectedGoalId(null)
      }

      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
      }
    },
  })

  useEffect(() => {
    if (goals.length === 0) {
      setSelectedGoalId(null)
      return
    }

    const hasSelectedGoal = goals.some((goal) => goal.id === selectedGoalId)
    if (!hasSelectedGoal) {
      setSelectedGoalId(goals[0]?.id ?? null)
    }
  }, [goals, selectedGoalId])

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId)
  const activeGoal = selectedGoal ?? goals[0]
  const normalizedGoalProtocol = normalize(activeGoal?.selectedProtocol)
  const normalizedVaultName = normalize(activeGoal?.selectedVaultName)
  const matchingPositionChainIds = new Set(
    portfolioPositions
      .filter((position) => {
        const normalizedProtocol = normalize(position.protocolName)
        const normalizedAssetName = normalize(position.asset.name)
        const normalizedAssetSymbol = normalize(position.asset.symbol)

        const protocolMatches = normalizedGoalProtocol
          ? normalizedProtocol === normalizedGoalProtocol
          : false
        const assetMatches = normalizedVaultName
          ? normalizedAssetName === normalizedVaultName ||
            normalizedAssetSymbol === normalizedVaultName ||
            normalizedAssetName?.includes(normalizedVaultName) ||
            normalizedVaultName.includes(normalizedAssetName ?? '')
          : false

        return protocolMatches || assetMatches
      })
      .map((position) => position.chainId),
  )
  const fallbackVaultMatches = vaults.filter(
    (vault) =>
      vault.name === activeGoal?.selectedVaultName &&
      vault.protocol.name === activeGoal?.selectedProtocol,
  )
  const activeGoalVault =
    vaults.find(
      (vault) =>
        activeGoal?.selectedVaultAddress &&
        vault.address.toLowerCase() ===
          activeGoal.selectedVaultAddress.toLowerCase(),
    ) ??
    fallbackVaultMatches.find((vault) =>
      matchingPositionChainIds.has(vault.chainId),
    ) ??
    fallbackVaultMatches[0]

  return (
    <div className="h-[calc(100vh-var(--navbar-height))] w-screen px-6 lg:px-8">
      <div className="flex h-[calc(100vh-var(--navbar-height))] gap-6 py-4">
        <div className="flex w-full flex-col gap-4 lg:w-4/12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Goals</h2>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              {isGoalsLoading ? 'Loading...' : `${goals.length} total`}
            </span>
          </div>
          <div
            className={cn(
              goals.length === 0 && !isGoalsLoading ? 'flex-none' : 'flex-1',
              'flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur',
            )}
          >
            {isGoalsLoading ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <GoalCardSkeleton />
                <GoalCardSkeleton />
                <GoalCardSkeleton />
              </div>
            ) : goals.length ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    isSelected={goal.id === (selectedGoalId ?? goals[0].id)}
                    onClick={() => setSelectedGoalId(goal.id)}
                    onDelete={(goalToDelete) => {
                      void deleteGoalMutation.mutateAsync(goalToDelete.id)
                    }}
                    isDeleting={
                      deleteGoalMutation.isPending &&
                      deleteGoalMutation.variables === goal.id
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="">
                <div className="p-6  shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                  <SectionBadge text='Fresh start' badge={<Sparkles className="size-3.5" />}/> 
                  <h3 className="mt-4 text-2xl font-semibold leading-tight">
                    Your first goal can start with one clear first deposit.
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-800">
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
                          <p className="text-sm font-medium ">
                            Define the target
                          </p>
                          <p className="text-xs text-slate-800">
                            Name the goal and set the current amount.
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
                          <p className="text-sm font-medium ">
                            Pick a live yield
                          </p>
                          <p className="text-xs text-slate-800">
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

        <GoalDetailsPanel
          goal={isGoalsLoading ? undefined : activeGoal}
          positions={portfolioPositions}
          vault={activeGoalVault}
          isLoading={isGoalsLoading}
        />
      </div>
    </div>
  )
}

export default HomePage
