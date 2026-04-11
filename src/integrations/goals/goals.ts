import { prisma } from '#/db'
import type { Goal } from '#/types'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const walletAddressSchema = z.object({
  walletAddress: z.string().min(1),
})

const createGoalSchema = z.object({
  walletAddress: z.string().min(1),
  name: z.string().min(1),
  monthlyAmount: z.number().nonnegative(),
  goalAmount: z.number().positive(),
  selectedVaultName: z.string().optional(),
  selectedProtocol: z.string().optional(),
})

function mapGoal(goal: {
  id: string
  walletAddress: string
  name: string
  monthlyAmount: { toString(): string }
  goalAmount: { toString(): string }
  selectedVaultName: string | null
  selectedProtocol: string | null
  createdAt: Date
  updatedAt: Date
}): Goal {
  return {
    id: goal.id,
    walletAddress: goal.walletAddress,
    name: goal.name,
    monthlyAmount: Number(goal.monthlyAmount.toString()),
    goalAmount: Number(goal.goalAmount.toString()),
    selectedVaultName: goal.selectedVaultName ?? undefined,
    selectedProtocol: goal.selectedProtocol ?? undefined,
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
      orderBy: { createdAt: 'desc' },
    })

    return goals.map(mapGoal)
  })

export const createGoal = createServerFn({ method: 'POST' })
  .inputValidator((input) => createGoalSchema.parse(input))
  .handler(async ({ data }): Promise<Goal> => {
    const goal = await prisma.goal.create({
      data: {
        walletAddress: data.walletAddress,
        name: data.name,
        monthlyAmount: data.monthlyAmount.toFixed(2),
        goalAmount: data.goalAmount.toFixed(2),
        selectedVaultName: data.selectedVaultName,
        selectedProtocol: data.selectedProtocol,
      },
    })

    return mapGoal(goal)
  })

export function goalsQueryOptions(walletAddress: string) {
  return queryOptions<Goal[]>({
    queryKey: ['goals', walletAddress],
    queryFn: () => listGoals({ data: { walletAddress } }),
    staleTime: 1000 * 30,
  })
}
