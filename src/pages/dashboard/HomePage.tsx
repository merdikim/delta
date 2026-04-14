import GoalDetailsPanel from '#/components/dashboard/GoalDetailsPanel'
import GoalCard from '#/components/cards/GoalCard'
import DeleteGoalModal from '#/components/modals/DeleteGoalModal'
import { addGoalWithdrawal, deleteGoal, goalsQueryOptions } from '#/integrations/goals/goals'
import { getComposerQuote } from '#/integrations/lifi/composer'
import {
  withdrawFromVault,
  earnPortfolioPositionsQueryOptions,
  earnVaultsQueryOptions,
} from '#/integrations/lifi/earn'
import type { EarnVault, Goal } from '#/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { parseUnits, zeroAddress } from 'viem'
import { switchChain } from '@wagmi/core'
import { cn } from '#/lib/utils'
import { ArrowRight, Goal as GoalIcon, Sparkles, Target } from 'lucide-react'
import SectionBadge from '#/components/cards/SectionBadge'
import { SUPPORTED_ASSETS } from '#/utils'

function resolveGoalVault({
  goal,
  vaults,
}: {
  goal?: Goal | null
  vaults: EarnVault[]
}) {
  if (!goal?.selectedVaultAddress) {
    return undefined
  }

  const selectedVaultAddress = goal.selectedVaultAddress.toLowerCase()

  return vaults.find(
    (vault) =>
      vault.address.toLowerCase() === selectedVaultAddress &&
      (goal.selectedVaultChainId == null ||
        vault.chainId === goal.selectedVaultChainId),
  )
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
  const config = useConfig()
  const { address, chainId } = useAccount()
  const { data: goals = [], isPending: isGoalsLoading } = useQuery<Goal[]>({
    ...goalsQueryOptions(address ?? ''),
    enabled: Boolean(address),
  })
  const { data: vaults = [] } = useQuery<EarnVault[]>(earnVaultsQueryOptions())
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [goalPendingDeletion, setGoalPendingDeletion] = useState<Goal | null>(
    null,
  )
  const [withdrawAmount, setWithdrawAmount] = useState('0')
  const [withdrawDestinationChainId, setWithdrawDestinationChainId] =
    useState<number>(SUPPORTED_ASSETS.networks.base.id)

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

      setGoalPendingDeletion((currentGoal) =>
        currentGoal?.id === goalId ? null : currentGoal,
      )

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
  const activeGoalVault = resolveGoalVault({
    goal: activeGoal,
    vaults,
  })
  const goalPendingDeletionVault = resolveGoalVault({
    goal: goalPendingDeletion,
    vaults,
  })
  const destinationChainOptions = Object.values(SUPPORTED_ASSETS.networks).map(
    (network) => ({
      id: network.id,
      label: network.label,
    }),
  )
  const withdrawDestinationChain =
    Object.values(SUPPORTED_ASSETS.networks).find(
      (network) => network.id === withdrawDestinationChainId,
    ) ?? SUPPORTED_ASSETS.networks.base
  const withdrawalAmountNumber = Number(withdrawAmount) || 0

  useEffect(() => {
    if (!goalPendingDeletion) {
      setWithdrawAmount('0')
      setWithdrawDestinationChainId(SUPPORTED_ASSETS.networks.base.id)
      return
    }

    setWithdrawAmount(goalPendingDeletion.currentAmount.toFixed(2))
    setWithdrawDestinationChainId(SUPPORTED_ASSETS.networks.base.id)
  }, [goalPendingDeletion])

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!address || !goalPendingDeletion || !goalPendingDeletionVault) {
        throw new Error('Wallet, goal, or vault missing')
      }

      const withdrawToken =
        goalPendingDeletionVault.underlyingTokens[0]?.symbol.toUpperCase() ??
        'USDC'
      const supportedToken = Object.values(SUPPORTED_ASSETS.tokens).find(
        (token) => token.symbol === withdrawToken,
      )
      const toToken =
        withdrawToken === 'ETH'
          ? zeroAddress
          : supportedToken && 'addresses' in supportedToken
            ? supportedToken.addresses[withdrawDestinationChain.key]
            : undefined

      if (!toToken) {
        throw new Error(`Unable to withdraw ${withdrawToken} to this chain.`)
      }

      const quoteDecimals =
        goalPendingDeletionVault.lpTokens[0]?.decimals ??
        supportedToken?.decimals ??
        goalPendingDeletionVault.underlyingTokens[0]?.decimals ??
        6

      const quote = await getComposerQuote({
        data: {
          fromChain: goalPendingDeletionVault.chainId,
          toChain: withdrawDestinationChain.id,
          fromToken: goalPendingDeletionVault.address,
          toToken,
          fromAddress: address,
          toAddress: address,
          fromAmount: parseUnits(withdrawAmount, quoteDecimals).toString(),
        },
      })

      if (chainId !== goalPendingDeletionVault.chainId) {
        await switchChain(config, { chainId: goalPendingDeletionVault.chainId })
      }

      const txHash = await withdrawFromVault({
        quote,
        account: address,
        chainId: goalPendingDeletionVault.chainId,
        config,
      })

      return addGoalWithdrawal({
        data: {
          goalId: goalPendingDeletion.id,
          walletAddress: address,
          amount: withdrawalAmountNumber,
          txHash,
        },
      })
    },
    onSuccess: async (updatedGoal) => {
      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
        await queryClient.invalidateQueries(
          earnPortfolioPositionsQueryOptions(address),
        )
      }

      setGoalPendingDeletion(updatedGoal)
      setWithdrawAmount(Math.max(updatedGoal.currentAmount, 0).toFixed(2))
    },
  })

  const handleCloseDeleteModal = () => {
    withdrawMutation.reset()
    deleteGoalMutation.reset()
    setGoalPendingDeletion(null)
  }

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
                    onDelete={setGoalPendingDeletion}
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
          vault={activeGoalVault}
          isLoading={isGoalsLoading}
        />
      </div>

      <DeleteGoalModal
        goal={goalPendingDeletion}
        vault={goalPendingDeletionVault}
        isOpen={Boolean(goalPendingDeletion)}
        isDeleting={deleteGoalMutation.isPending}
        isWithdrawing={withdrawMutation.isPending}
        withdrawAmount={withdrawAmount}
        withdrawAmountNumber={withdrawalAmountNumber}
        withdrawError={
          withdrawMutation.error instanceof Error
            ? withdrawMutation.error.message
            : withdrawMutation.isError
              ? 'Unable to withdraw from this goal right now.'
              : undefined
        }
        destinationChainOptions={destinationChainOptions}
        selectedDestinationChainId={withdrawDestinationChainId}
        onSelectDestinationChain={setWithdrawDestinationChainId}
        onWithdrawAmountChange={setWithdrawAmount}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={(goal) => {
          void deleteGoalMutation.mutateAsync(goal.id)
        }}
        onWithdraw={() => {
          void withdrawMutation.mutateAsync()
        }}
      />
    </div>
  )
}

export default HomePage
