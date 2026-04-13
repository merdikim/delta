import DepositIntoVaultModal from '#/components/modals/DepositIntoVaultModal'
import DepositPendingModal from '#/components/modals/DepositPendingModal'
import { addGoalDeposit, goalsQueryOptions } from '#/integrations/goals/goals'
import { getComposerQuote } from '#/integrations/lifi/composer'
import {
  depositToVault,
  earnPortfolioPositionsQueryOptions,
} from '#/integrations/lifi/earn'
import type { EarnPortfolioPosition, EarnVault, Goal } from '#/types'
import {
  formatDate,
  formatTokenBalance,
  formatUsd,
  SUPPORTED_ASSETS,
} from '#/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Coins, Plus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { switchChain } from '@wagmi/core'
import { erc20Abi, parseUnits, zeroAddress } from 'viem'
import { useAccount, useBalance, useConfig, useReadContracts } from 'wagmi'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function normalize(value?: string) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function calculateProjectedYield(
  principal: number,
  annualApyPercent: number,
  days: number,
) {
  if (principal <= 0 || annualApyPercent <= 0 || days <= 0) {
    return 0
  }

  const annualRate = annualApyPercent / 100
  return principal * ((1 + annualRate) ** (days / 365) - 1)
}

export default function GoalDetailsPanel({
  goal,
  positions = [],
  yieldPercent = 0,
  vault,
  isLoading = false,
}: {
  goal?: Goal
  positions?: EarnPortfolioPosition[]
  yieldPercent?: number
  vault?: EarnVault
  isLoading?: boolean
}) {
  const queryClient = useQueryClient()
  const config = useConfig()
  const { address, chainId } = useAccount()
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('0')
  const [selectedFundingChainId, setSelectedFundingChainId] = useState<number>(
    SUPPORTED_ASSETS.networks.base.id,
  )
  const [depositStage, setDepositStage] = useState<
    'idle' | 'txHash' | 'database'
  >('idle')
  const supportedNetworks = Object.values(SUPPORTED_ASSETS.networks)
  const balanceQuery = { enabled: Boolean(address), refetchInterval: 15_000 }
  const ethMainnetBalance = useBalance({
    address,
    chainId: SUPPORTED_ASSETS.networks.eth.id,
    query: balanceQuery,
  })
  const ethBaseBalance = useBalance({
    address,
    chainId: SUPPORTED_ASSETS.networks.base.id,
    query: balanceQuery,
  })
  const ethOptimismBalance = useBalance({
    address,
    chainId: SUPPORTED_ASSETS.networks.optimism.id,
    query: balanceQuery,
  })
  const supportedTokenBalanceContracts = Object.entries(
    SUPPORTED_ASSETS.tokens,
  ).flatMap(([tokenKey, token]) => {
    if (tokenKey === 'eth' || !('addresses' in token) || !address) {
      return []
    }

    return supportedNetworks.map((network) => ({
      abi: erc20Abi,
      address: token.addresses[network.key]!,
      chainId: network.id,
      functionName: 'balanceOf' as const,
      args: [address] as const,
    }))
  })
  const supportedTokenBalances = useReadContracts({
    contracts: supportedTokenBalanceContracts,
    query: balanceQuery,
  })
  const currentAmount = goal?.currentAmount ?? 0
  const targetAmount = goal?.goalAmount ?? 0
  const depositsAscending = [...(goal?.deposits ?? [])].reverse()
  const hasDepositsChart = depositsAscending.length > 0
  const outerRadius = 72
  const innerRadius = 52
  const outerCircumference = 2 * Math.PI * outerRadius
  const innerCircumference = 2 * Math.PI * innerRadius

  const normalizedGoalProtocol = normalize(goal?.selectedProtocol)
  const normalizedVaultName = normalize(goal?.selectedVaultName)
  const matchingPositions = positions.filter((position) => {
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

  const displayedPositions =
    matchingPositions.length > 0 ? matchingPositions : positions
  const totalPositionUsd = displayedPositions.reduce(
    (total, position) => total + Number(position.balanceUsd || 0),
    0,
  )
  const depositsProgressPercent =
    targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0
  const trackedValue = Math.max(totalPositionUsd, currentAmount)
  const trackedProgressPercent =
    targetAmount > 0 ? Math.min((trackedValue / targetAmount) * 100, 100) : 0
  const trackedStroke = (trackedProgressPercent / 100) * outerCircumference
  const depositsStroke = (depositsProgressPercent / 100) * innerCircumference
  const remainingToTarget = Math.max(targetAmount - totalPositionUsd, 0)
  const hasSelectedVault = Boolean(vault)
  const depositAmountNumber = Number(depositAmount) || 0
  const selectedVaultTokenSymbol =
    vault?.underlyingTokens[0]?.symbol.toUpperCase() ?? 'USDC'
  const selectedSupportedToken = Object.values(SUPPORTED_ASSETS.tokens).find(
    (token) => token.symbol === selectedVaultTokenSymbol,
  )
  const selectedTokenDecimals = selectedSupportedToken?.decimals ?? 6
  const selectedVaultNetwork = supportedNetworks.find(
    (network) => network.id === vault?.chainId,
  )
  const destinationChainLabel = selectedVaultNetwork?.label ?? vault?.network ?? 'the destination chain'
  const projectedPrincipal = currentAmount
  const sevenDayApyPercent = vault?.analytics.apy7d ?? yieldPercent
  const oneMonthApyPercent = vault?.analytics.apy30d ?? yieldPercent
  const oneYearApyPercent = vault?.analytics.apy.total ?? yieldPercent
  const projectedSevenDayYield = calculateProjectedYield(
    projectedPrincipal,
    sevenDayApyPercent,
    7,
  )
  const projectedOneMonthYield = calculateProjectedYield(
    projectedPrincipal,
    oneMonthApyPercent,
    30,
  )
  const projectedOneYearYield = calculateProjectedYield(
    projectedPrincipal,
    oneYearApyPercent,
    365,
  )

  const projectedValueOneYear = projectedOneYearYield

  const getTokenBalanceForChain = (targetChainId: number) => {
    if (selectedVaultTokenSymbol === 'ETH') {
      return targetChainId === SUPPORTED_ASSETS.networks.eth.id
        ? (ethMainnetBalance.data?.value ?? 0n)
        : targetChainId === SUPPORTED_ASSETS.networks.base.id
          ? (ethBaseBalance.data?.value ?? 0n)
          : targetChainId === SUPPORTED_ASSETS.networks.optimism.id
            ? (ethOptimismBalance.data?.value ?? 0n)
            : 0n
    }

    const supportedErc20Tokens = Object.values(SUPPORTED_ASSETS.tokens).filter(
      (token) => token.symbol !== 'ETH',
    )
    const tokenIndex = supportedErc20Tokens.findIndex(
      (token) => token.symbol === selectedVaultTokenSymbol,
    )
    const networkIndex = supportedNetworks.findIndex(
      (network) => network.id === targetChainId,
    )

    if (tokenIndex < 0 || networkIndex < 0) {
      return 0n
    }

    const result =
      supportedTokenBalances.data?.[
        tokenIndex * supportedNetworks.length + networkIndex
      ]

    return result?.status === 'success' ? result.result : 0n
  }

  const requiredSelectedTokenAmount =
    depositAmountNumber > 0 ? parseUnits(depositAmount, selectedTokenDecimals) : 0n
  const fundingChainOptions = supportedNetworks.map((network) => {
    const balance = getTokenBalanceForChain(network.id)
    return {
      id: network.id,
      label: network.label,
      balance,
      isAvailable:
        depositAmountNumber <= 0 || balance >= requiredSelectedTokenAmount,
      isDestinationChain: network.id === vault?.chainId,
    }
  })
  const fallbackFundingChainId =
    chainId && supportedNetworks.some((network) => network.id === chainId)
      ? chainId
      : vault?.chainId ?? SUPPORTED_ASSETS.networks.base.id
  const selectedFundingChain =
    supportedNetworks.find((network) => network.id === selectedFundingChainId) ??
    supportedNetworks.find((network) => network.id === fallbackFundingChainId) ??
    supportedNetworks[0]
  const selectedFundingChainBalance = getTokenBalanceForChain(
    selectedFundingChain.id,
  )
  const hasSufficientFundsOnSelectedChain =
    depositAmountNumber <= 0 ||
    selectedFundingChainBalance >= requiredSelectedTokenAmount
  const hasAnySupportedFundingChain =
    depositAmountNumber <= 0 ||
    fundingChainOptions.some((network) => network.isAvailable)

  useEffect(() => {
    const preferredChainId =
      fundingChainOptions.find(
        (network) => network.id === chainId && network.isAvailable,
      )?.id ??
      fundingChainOptions.find((network) => network.isAvailable)?.id ??
      fallbackFundingChainId

    if (preferredChainId !== selectedFundingChainId) {
      setSelectedFundingChainId(preferredChainId)
    }
  }, [
    chainId,
    fallbackFundingChainId,
    fundingChainOptions,
    selectedFundingChainId,
  ])

  const addPositionMutation = useMutation({
    mutationFn: async () => {
      if (!address || !vault) {
        throw new Error('Wallet or vault missing')
      }

      setDepositStage('txHash')

      const fromAmount = parseUnits(
        depositAmount,
        selectedTokenDecimals,
      ).toString()
      const fromToken =
        selectedVaultTokenSymbol === 'ETH'
          ? zeroAddress
          : selectedSupportedToken &&
              'addresses' in selectedSupportedToken
            ? selectedSupportedToken.addresses[selectedFundingChain.key]
            : undefined

      if (!fromToken) {
        throw new Error(
          `Unable to fund this deposit with ${selectedVaultTokenSymbol}.`,
        )
      }

      const quote = await getComposerQuote({
        data: {
          fromChain: selectedFundingChain.id,
          toChain: vault.chainId,
          fromToken,
          toToken: vault.address,
          fromAddress: address,
          toAddress: address,
          fromAmount,
        },
      })

      if (chainId !== selectedFundingChain.id) {
        await switchChain(config, { chainId: selectedFundingChain.id })
      }

      const txHash = await depositToVault({
        quote,
        account: address,
        chainId: selectedFundingChain.id,
        config,
      })

      setDepositStage('database')

      return addGoalDeposit({
        data: {
          // @ts-expect-error
          goalId: goal.id,
          walletAddress: address,
          amount: depositAmountNumber,
          txHash,
        },
      })
    },
    onSuccess: async () => {
      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
        await queryClient.invalidateQueries(
          earnPortfolioPositionsQueryOptions(address),
        )
      }

      setIsAddPositionModalOpen(false)
      setDepositAmount('0')
    },
    onSettled: () => {
      setDepositStage('idle')
    },
  })

  const handleAddPosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      addPositionMutation.isPending ||
      !address ||
      !vault ||
      depositAmountNumber <= 0 ||
      !hasAnySupportedFundingChain ||
      !hasSufficientFundsOnSelectedChain
    ) {
      return
    }

    await addPositionMutation.mutateAsync()
  }

  if (isLoading) {
    return (
      <div className="hidden flex-1 lg:block">
        <div className="flex h-full animate-pulse flex-col gap-5 rounded-4xl border border-white/70 bg-white/45 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur xl:p-8">
          <div className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
            <div className="h-8 w-56 rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <div className="h-20 rounded-2xl bg-slate-200" />
              <div className="h-20 rounded-2xl bg-slate-200" />
              <div className="h-20 rounded-2xl bg-slate-200" />
              <div className="h-20 rounded-2xl bg-slate-200" />
            </div>
          </div>

          <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <div className="rounded-4xl bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]" />
            <div className="rounded-4xl bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]" />
          </div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="hidden flex-1 lg:block">
        <div className="flex h-full items-center justify-center rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="max-w-xl px-8 text-center">
            <h3 className="mt-4 text-4xl font-semibold leading-tight text-slate-950">
              Turn a future purchase into a clear savings path.
            </h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Start with a target, track your current amount, and compare live
              protocol yields to see how quickly compounding can get you there.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden flex-1 lg:block">
      <DepositPendingModal
        isOpen={addPositionMutation.isPending}
        isWaitingForTxHash={
          addPositionMutation.isPending && depositStage !== 'database'
        }
        isWaitingForDatabase={depositStage === 'database'}
      />
      <DepositIntoVaultModal
        goal={goal}
        vault={vault}
        isOpen={isAddPositionModalOpen && !addPositionMutation.isPending}
        isPending={addPositionMutation.isPending}
        hasSelectedVault={hasSelectedVault}
        depositAmount={depositAmount}
        depositAmountNumber={depositAmountNumber}
        error={
          addPositionMutation.error instanceof Error
            ? addPositionMutation.error.message
            : addPositionMutation.isError
              ? 'Unable to add the position right now.'
              : undefined
        }
        tokenSymbol={selectedVaultTokenSymbol}
        tokenDecimals={selectedTokenDecimals}
        destinationChainLabel={destinationChainLabel}
        fundingChainOptions={fundingChainOptions}
        selectedFundingChainId={selectedFundingChain.id}
        onSelectFundingChain={setSelectedFundingChainId}
        hasAnySupportedFundingChain={hasAnySupportedFundingChain}
        hasSufficientFundsOnSelectedChain={hasSufficientFundsOnSelectedChain}
        selectedFundingChainLabel={selectedFundingChain.label}
        selectedFundingChainBalance={selectedFundingChainBalance}
        formatTokenBalance={formatTokenBalance}
        onClose={() => setIsAddPositionModalOpen(false)}
        onDepositAmountChange={setDepositAmount}
        onSubmit={(event) => void handleAddPosition(event)}
      />

      <div className="flex h-full rounded-4xl border border-white/70 bg-white/45 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
        <div className="flex w-full flex-col gap-6 p-6 xl:p-8 overflow-scroll">
          <div className="rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,245,249,0.84))] p-6 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
            <h3 className="truncate text-2xl font-semibold leading-tight text-slate-950">
              {goal.name}
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <StatCard label="Target amount" value={formatUsd(targetAmount)} />
              <StatCard
                label="Current amount"
                value={formatUsd(currentAmount)}
              />
              <StatCard
                label="Yield"
                value={`${yieldPercent.toFixed(2)}% APY`}
              />
              <StatCard
                label="Projected value(1year)"
                value={formatUsd(projectedValueOneYear)}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <CalendarDays className="size-3.5" />
                Created {formatDate(goal.createdAt)}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <Coins className="size-3.5" />
                Remaining {formatUsd(remainingToTarget)}
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <section className="rounded-4xl border border-white/70 bg-white/80 self-start p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Deposit progress
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 p-4">
                {hasDepositsChart ? (
                  <div className="grid items-center gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="flex justify-center">
                      <svg
                        viewBox="0 0 200 200"
                        className="h-52 w-52"
                        role="img"
                        aria-label="Current deposits and deposits plus yield toward target amount"
                      >
                        <circle
                          cx="100"
                          cy="100"
                          r={outerRadius}
                          fill="none"
                          stroke="#dbeafe"
                          strokeWidth="16"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r={outerRadius}
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={`${trackedStroke} ${outerCircumference}`}
                          transform="rotate(-90 100 100)"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r={innerRadius}
                          fill="none"
                          stroke="#d1fae5"
                          strokeWidth="16"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r={innerRadius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={`${depositsStroke} ${innerCircumference}`}
                          transform="rotate(-90 100 100)"
                        />
                        <circle cx="100" cy="100" r="36" fill="white" />
                        <text
                          x="100"
                          y="90"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="11"
                        >
                          Deposits
                        </text>
                        <text
                          x="100"
                          y="112"
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize="22"
                          fontWeight="700"
                        >
                          {depositsProgressPercent.toFixed(0)}%
                        </text>
                      </svg>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                  
                        <div className="rounded-2xl h-12 border flex justify-between items-center border-slate-200 bg-slate-50/80 px-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Projected 1 year yield
                          </p>
                          <p className="text-sm text-slate-950">
                            {formatUsd(projectedOneYearYield)}
                          </p>
                        </div>
                        <div className="rounded-2xl h-12 border flex justify-between items-center border-slate-200 bg-slate-50/80 px-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Projected 1 month yield
                          </p>
                          <p className="text-sm text-slate-950">
                            {formatUsd(projectedOneMonthYield)}
                          </p>
                        </div>
                        <div className="rounded-2xl h-12 border flex justify-between items-center border-slate-200 bg-slate-50/80 px-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Projected 7 days yield
                          </p>
                          <p className="text-sm text-slate-950">
                            {formatUsd(projectedSevenDayYield)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <p className="text-base font-medium text-slate-700">
                      No deposits recorded
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add deposits to this goal to see how funding is tracking
                      against the target amount.
                    </p>
                  </div>
                )}
              </div>
              <div className="w-full flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center">
                  Current deposits{' '}
                  <div className="h-3 w-3 ml-2 bg-[#10b981]"></div>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 mr-2 bg-[#0ea5e9]"></div> Current
                  deposits + yield{' '}
                </div>
              </div>
            </section>

            <section className="flex flex-col rounded-4xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Deposits({goal.deposits.length})
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPositionModalOpen(true)
                  }}
                  className="flex items-center justify-between rounded-2xl border border-primary bg-primary p-2 text-left transition hover:bg-emerald-500"
                  disabled={!hasSelectedVault}
                >
                  <div className='flex items-center justify-between w-full'>
                    <p className=" font-semibold text-white">Add amount</p>
                    <span className='bg-white rounded-full h-6 w-6 flex items-center justify-center'><Plus className="size-4 font-bold" /></span> 
                  </div>
                </button>
              </div>

              <div className="mt-5 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 border-b border-slate-200 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {goal.deposits.length > 0 ? (
                    goal.deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3"
                      >
                        <p className="text-sm text-slate-600">
                          {formatDate(deposit.createdAt, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-right text-sm font-semibold text-slate-950">
                          {formatUsd(deposit.amount)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No recorded deposits yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Deposits added to this goal will appear here with their
                        amounts and transaction hashes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
