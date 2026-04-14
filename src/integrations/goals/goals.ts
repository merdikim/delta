import { prisma } from '#/db'
import type { Goal } from '#/types'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const GOAL_DELETION_BALANCE_THRESHOLD = 0.09

const walletAddressSchema = z.object({
  walletAddress: z.string().min(1),
})

const createGoalSchema = z.object({
  walletAddress: z.string().min(1),
  name: z.string().min(1),
  currentAmount: z.number().positive(),
  goalAmount: z.number().positive(),
  selectedVaultName: z.string().optional(),
  selectedVaultAddress: z.string().min(1),
  selectedVaultChainId: z.number().int().positive().optional(),
  selectedProtocol: z.string().optional(),
  txHash: z.string().min(1),
})

const deleteGoalSchema = z.object({
  id: z.string().min(1),
  walletAddress: z.string().min(1),
})

const addGoalDepositSchema = z.object({
  goalId: z.string().min(1),
  walletAddress: z.string().min(1),
  amount: z.number().positive(),
  txHash: z.string().min(1),
})

const addGoalWithdrawalSchema = z.object({
  goalId: z.string().min(1),
  walletAddress: z.string().min(1),
  amount: z.number().positive(),
  txHash: z.string().min(1),
})

type GoalRecord = {
  id: string
  walletAddress: string
  name: string
  monthlyAmount: { toString: () => string }
  goalAmount: { toString: () => string }
  selectedVaultName: string | null
  selectedVaultAddress?: string | null
  selectedVaultChainId?: number | null
  selectedProtocol: string | null
  deposits: Array<{
    id: string
    amount: { toString: () => string }
    txHash: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const goalInclude = {
  deposits: {
    orderBy: { createdAt: 'desc' as const },
  },
}

function mapGoal(goal: GoalRecord): Goal {
  const deposits = goal.deposits.map((deposit) => ({
    id: deposit.id,
    amount: Number(deposit.amount.toString()),
    txHash: deposit.txHash,
    createdAt: deposit.createdAt.toISOString(),
  }))

  return {
    id: goal.id,
    walletAddress: goal.walletAddress,
    name: goal.name,
    currentAmount:
      deposits.length > 0
        ? deposits.reduce((total, deposit) => total + deposit.amount, 0)
        : Number(goal.monthlyAmount.toString()),
    goalAmount: Number(goal.goalAmount.toString()),
    selectedVaultName: goal.selectedVaultName ?? undefined,
    selectedVaultAddress: goal.selectedVaultAddress ?? '',
    selectedVaultChainId: goal.selectedVaultChainId ?? undefined,
    selectedProtocol: goal.selectedProtocol ?? undefined,
    deposits,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  }
}

export const listGoals = createServerFn({ method: 'GET' })
  .inputValidator((input: { walletAddress: string }) =>
    walletAddressSchema.parse(input),
  )
  .handler(async ({ data }): Promise<Goal[]> => {
    const goals = await prisma.goal.findMany({
      where: { walletAddress: data.walletAddress },
      include: goalInclude,
      orderBy: { createdAt: 'desc' },
    })

    return goals.map((goal) => mapGoal(goal as GoalRecord))
  })

export const createGoal = createServerFn({ method: 'POST' })
  .inputValidator((input) => createGoalSchema.parse(input))
  .handler(async ({ data }): Promise<Goal> => {
    const goal = await prisma.goal.create({
      data: {
        walletAddress: data.walletAddress,
        name: data.name,
        monthlyAmount: data.currentAmount.toFixed(2),
        goalAmount: data.goalAmount.toFixed(2),
        selectedVaultName: data.selectedVaultName,
        selectedVaultAddress: data.selectedVaultAddress,
        selectedVaultChainId: data.selectedVaultChainId,
        selectedProtocol: data.selectedProtocol,
        deposits: {
          create: {
            amount: data.currentAmount.toFixed(2),
            txHash: data.txHash,
          },
        },
      } as never,
      include: goalInclude,
    })

    return mapGoal(goal as GoalRecord)
  })

export const addGoalDeposit = createServerFn({ method: 'POST' })
  .inputValidator((input) => addGoalDepositSchema.parse(input))
  .handler(async ({ data }): Promise<Goal> => {
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: data.goalId,
        walletAddress: data.walletAddress,
      },
      select: { id: true },
    })

    if (!existingGoal) {
      throw new Error('Goal not found')
    }

    const goal = await prisma.goal.update({
      where: { id: data.goalId },
      data: {
        deposits: {
          create: {
            amount: data.amount.toFixed(2),
            txHash: data.txHash,
          },
        },
      },
      include: goalInclude,
    })

    return mapGoal(goal as GoalRecord)
  })

export const addGoalWithdrawal = createServerFn({ method: 'POST' })
  .inputValidator((input) => addGoalWithdrawalSchema.parse(input))
  .handler(async ({ data }): Promise<Goal> => {
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: data.goalId,
        walletAddress: data.walletAddress,
      },
      include: goalInclude,
    })

    if (!existingGoal) {
      throw new Error('Goal not found')
    }

    const currentBalance = mapGoal(existingGoal as GoalRecord).currentAmount

    if (data.amount > currentBalance) {
      throw new Error('Withdrawal amount exceeds the goal balance')
    }

    const goal = await prisma.goal.update({
      where: { id: data.goalId },
      data: {
        deposits: {
          create: {
            amount: (-data.amount).toFixed(2),
            txHash: data.txHash,
          },
        },
      },
      include: goalInclude,
    })

    return mapGoal(goal as GoalRecord)
  })

export const deleteGoal = createServerFn({ method: 'POST' })
  .inputValidator((input) => deleteGoalSchema.parse(input))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: data.id,
        walletAddress: data.walletAddress,
      },
      include: goalInclude,
    })

    if (!existingGoal) {
      throw new Error('Goal not found')
    }

    const currentBalance = mapGoal(existingGoal as GoalRecord).currentAmount

    if (currentBalance >= GOAL_DELETION_BALANCE_THRESHOLD) {
      throw new Error('Withdraw funds below $0.09 before deleting this goal')
    }

    await prisma.goal.delete({
      where: { id: data.id },
    })

    return { id: data.id }
  })

export function goalsQueryOptions(walletAddress: string) {
  return queryOptions<Goal[]>({
    queryKey: ['goals', walletAddress],
    queryFn: () => listGoals({ data: { walletAddress } }),
    staleTime: 1000 * 30,
  })
}
