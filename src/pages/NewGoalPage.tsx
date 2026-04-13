import BridgeModal from '#/components/modals/BridgeModal'
import CreateGoalPendingModal from '#/components/modals/CreateGoalPendingModal'
import SuccessModal from '#/components/modals/SuccessModal'
import Navbar from '#/components/Navbar'
import { createGoal, goalsQueryOptions } from '#/integrations/goals/goals'
import { getComposerQuote } from '#/integrations/lifi/composer'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  depositToVault,
  earnVaultsQueryOptions,
} from '#/integrations/lifi/earn'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Coins,
  Landmark,
  TrendingUp,
} from 'lucide-react'
import type { EarnVault } from '#/types'
import {
  BASE_CHAIN_ID,
  BASE_USDC_ADDRESS,
  confettiPieces,
  formatCompactUsd,
  formatPercent,
  formatTokenBalance,
  formatUsd,
} from '#/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAccount, useBalance, useConfig } from 'wagmi'
import { sendTransaction, switchChain } from '@wagmi/core'
import { parseUnits } from 'viem'

const NewGoalPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const config = useConfig()
  const { address, chainId } = useAccount()
  const { data: allVaults = [] } = useSuspenseQuery<EarnVault[]>(
    earnVaultsQueryOptions(),
  )
  const vaults = allVaults.filter((vault) => vault.isTransactional)
  const [goalName, setGoalName] = useState('')
  const [currentAmount, setCurrentAmount] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [selectedVaultIndex, setSelectedVaultIndex] = useState(0)
  const [goalCreationStage, setGoalCreationStage] = useState<
    'idle' | 'txHash' | 'database'
  >('idle')
  const [showSuccessState, setShowSuccessState] = useState(false)
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false)
  const balanceQuery = { enabled: Boolean(address), refetchInterval: 15_000 }

  const usdcBaseBalance = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    token: BASE_USDC_ADDRESS,
    query: balanceQuery,
  })

  if (vaults.length === 0) {
    return (
      <main className="h-screen overflow-hidden px-4 sm:px-5 lg:px-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <Navbar />

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full text-center max-w-3xl rounded-4xl border border-white/70 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                <AlertCircle className="size-3.5" />
                Deposits unavailable
              </div>

              <h1 className="mt-4 text-xl font-semibold leading-tight sm:text-2xl">
                Goal creation is paused until a depositable vault comes back
                online.
              </h1>

              <p className="mt-4 text-sm leading-7 text-center px-20 sm:px-32 sm:text-base">
                LI.FI didn&apos;t return any Base USDC vaults that accept
                deposits right now, so Delta can&apos;t safely create a funded
                goal at the moment.
              </p>

              <div className="mt-6 flex justify-center text-center sm:flex-row">
                <Link
                  to="/home"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  <ArrowLeft className="size-4" />
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const topVault = vaults[0]
  const selectedVault = vaults[selectedVaultIndex] ?? topVault
  const currentAmountValue = Number(currentAmount) || 0
  const targetAmount = Number(goalAmount) || 0
  const selectedApy = selectedVault.analytics.apy.total
  const monthlyRate = selectedApy / 100 / 12

  let projectedBalance = currentAmountValue
  let monthsToGoal = 0
  const maxProjectionMonths = 600

  while (
    projectedBalance < targetAmount &&
    monthsToGoal < maxProjectionMonths &&
    currentAmountValue > 0 &&
    targetAmount > 0
  ) {
    projectedBalance = projectedBalance * (1 + monthlyRate)
    monthsToGoal += 1
  }

  const hasReachableProjection =
    targetAmount > 0 &&
    currentAmountValue > 0 &&
    projectedBalance >= targetAmount

  const totalDeposits = currentAmountValue
  const interestEarned = Math.max(projectedBalance - currentAmountValue, 0)
  const yearsToGoal = monthsToGoal / 12
  const depositAmount =
    currentAmountValue > 0 ? parseUnits(currentAmount, 6) : 0n
  const baseUsdcBalance = usdcBaseBalance.data?.value
  const missingBaseUsdc =
    baseUsdcBalance === undefined || baseUsdcBalance >= depositAmount
      ? 0n
      : depositAmount - baseUsdcBalance
  const hasInsufficientBaseUsdc =
    currentAmountValue > 0 &&
    baseUsdcBalance !== undefined &&
    baseUsdcBalance < depositAmount

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('Wallet or vault missing')
      }

      setGoalCreationStage('txHash')

      const fromAmount = parseUnits(currentAmount, 6).toString()

      const quote = await getComposerQuote({
        data: {
          fromChain: selectedVault.chainId,
          toChain: selectedVault.chainId,
          fromToken: BASE_USDC_ADDRESS,
          toToken: selectedVault.address,
          fromAddress: address,
          toAddress: address,
          fromAmount,
        },
      })

      if (chainId !== selectedVault.chainId) {
        await switchChain(config, { chainId: selectedVault.chainId })
      }

      const txHash = await depositToVault({
        quote,
        account: address,
        chainId: selectedVault.chainId,
        config,
      })

      setGoalCreationStage('database')

      return createGoal({
        data: {
          walletAddress: address,
          name: goalName.trim(),
          currentAmount: currentAmountValue,
          goalAmount: targetAmount,
          selectedVaultName: selectedVault.name,
          selectedProtocol: selectedVault.protocol.name,
          txHash,
        },
      })
    },
    onSuccess: async () => {
      setShowSuccessState(true)

      if (address) {
        await queryClient.invalidateQueries(goalsQueryOptions(address))
      }

      window.setTimeout(() => {
        void navigate({ to: '/home' })
      }, 2000)
    },
    onSettled: () => {
      setGoalCreationStage('idle')
    },
  })

  const handleCreateGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      createGoalMutation.isPending ||
      !address ||
      !goalName.trim() ||
      currentAmountValue <= 0 ||
      targetAmount <= 0 ||
      hasInsufficientBaseUsdc
    ) {
      return
    }

    await createGoalMutation.mutateAsync()
  }

  return (
    <main className="h-screen overflow-hidden px-4 sm:px-5 lg:px-6">
      <CreateGoalPendingModal
        isOpen={createGoalMutation.isPending}
        isWaitingForTxHash={
          createGoalMutation.isPending && goalCreationStage !== 'database'
        }
        isWaitingForDatabase={goalCreationStage === 'database'}
      />
      <SuccessModal
        isOpen={showSuccessState}
        goalName={goalName}
        confettiPieces={confettiPieces}
      />
      {/* <BridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        missingBaseUsdc={missingBaseUsdc}
        baseUsdcBalance={baseUsdcBalance}
        formatTokenBalance={formatTokenBalance}
        chainOptions={Object.entries(BRIDGEABLE_CHAINS).map(([id, chain]) => ({
          id: Number(id),
          label: chain.label,
        }))}
        selectedChainId={bridgeSourceChainId}
        onSelectChain={setBridgeSourceChainId}
        selectedChainLabel={selectedBridgeSourceChain.label}
        isWalletOnSelectedChain={isWalletOnSelectedBridgeChain}
        quote={bridgeQuoteQuery.data}
        isQuoteLoading={bridgeQuoteQuery.isLoading}
        quoteError={
          bridgeQuoteQuery.error instanceof Error
            ? bridgeQuoteQuery.error.message
            : bridgeQuoteQuery.isError
              ? 'Unable to load bridge details right now.'
              : undefined
        }
        bridgeFeeAmount={bridgeFeeAmount}
        bridgeGasAmount={bridgeGasAmount}
        bridgeError={
          bridgeMutation.error instanceof Error
            ? bridgeMutation.error.message
            : bridgeMutation.isError
              ? 'Bridge failed. Please try again.'
              : undefined
        }
        isBridgePending={bridgeMutation.isPending}
        onConfirmBridge={() => void bridgeMutation.mutateAsync()}
      /> */}
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <Navbar />

        <div className="grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="min-h-0 space-y-4">
            <Card className="rounded-3xl border-white/70 bg-white/80 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardTitle className="text-xl text-slate-950">
                  Goal details
                </CardTitle>
                <CardDescription className="text-sm leading-5 text-slate-600">
                  Fill in the core numbers that shape your plan.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <form className="grid gap-4" onSubmit={handleCreateGoal}>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      Goal name
                    </span>
                    <input
                      type="text"
                      placeholder="Buy a new car"
                      value={goalName}
                      onChange={(event) => setGoalName(event.target.value)}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-800">
                        Current amount
                      </span>
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="500"
                          value={currentAmount}
                          onChange={(event) =>
                            setCurrentAmount(event.target.value)
                          }
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-800">
                        Goal amount
                      </span>
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <span className="mr-3 text-sm font-medium text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="20000"
                          value={goalAmount}
                          onChange={(event) =>
                            setGoalAmount(event.target.value)
                          }
                          className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  {createGoalMutation.isError ? (
                    <p className="text-sm font-medium text-red-600">
                      {createGoalMutation.error instanceof Error
                        ? createGoalMutation.error.message
                        : 'Unable to create goal right now.'}
                    </p>
                  ) : null}

                  {hasInsufficientBaseUsdc ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-medium">
                        Insufficient Base USDC balance
                      </p>
                      <p className="my-1 leading-5">
                        You have {formatTokenBalance(baseUsdcBalance, 6)} USDC
                        on Base, but this deposit needs{' '}
                        {formatTokenBalance(depositAmount, 6)} USDC.
                      </p>

                      <Button
                        type="button"
                        className="mt-2 w-full"
                        // onClick={openBridgeModal}
                      >
                        Bridge before continuing
                      </Button>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-emerald-900">
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-medium">Planning tip</p>
                        <p className="mt-1 leading-5">
                          A stronger current amount and better rates can help
                          your balance compound to the goal faster.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 md:flex-row md:items-center">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-10 w-full rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800 md:flex-1"
                      disabled={
                        createGoalMutation.isPending ||
                        !address ||
                        !goalName.trim() ||
                        currentAmountValue <= 0 ||
                        targetAmount <= 0 ||
                        hasInsufficientBaseUsdc
                      }
                    >
                      {createGoalMutation.isPending
                        ? 'Depositing and creating...'
                        : 'Deposit and create goal'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="min-h-0 space-y-4">
            <Card className="rounded-3xl border-slate-900/5 py-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Landmark className="size-4 text-emerald-300" />
                  Protocol yields
                </CardTitle>
                <CardDescription className="text-sm leading-5 text-slate-700">
                  Live vault data from LI.FI Earn, sorted by total
                  APY.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                {vaults.map((vault, index) => (
                  <button
                    key={`${vault.protocol.name}-${vault.name}-${index}`}
                    type="button"
                    onClick={() => setSelectedVaultIndex(index)}
                    className={`h-20 rounded-2xl border text-left transition ${
                      index === selectedVaultIndex
                        ? 'border-emerald-300'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex h-full items-center justify-between gap-3 rounded-[calc(1rem-1px)] px-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="shrink-0 text-sm font-semibold">
                            {vault.protocol.name}
                          </p>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-green-800">
                            TVL {formatCompactUsd(vault.analytics.tvl.usd)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px]">
                          {vault.name} • {vault.underlyingTokens[0]?.symbol} •{' '}
                          {vault.network}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.16em]">
                            APY
                          </p>
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatPercent(vault.analytics.apy.total)}
                          </p>
                        </div>
                        <div className="text-right text-[10px] leading-4">
                          <p>Base {formatPercent(vault.analytics.apy.base)}</p>
                          <p>
                            Reward {formatPercent(vault.analytics.apy.reward)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}

export default NewGoalPage
