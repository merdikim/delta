import BridgeModal from '#/components/modals/BridgeModal'
import CreateGoalPendingModal from '#/components/modals/CreateGoalPendingModal'
import SuccessModal from '#/components/modals/SuccessModal'
import Navbar from '#/components/Navbar'
import { createGoal, goalsQueryOptions } from '#/integrations/goals/goals'
import { getBridgeQuote } from '#/integrations/lifi/bridge'
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
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
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
  SUPPORTED_ASSETS,
} from '#/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAccount, useBalance, useConfig, useReadContracts } from 'wagmi'
import { sendTransaction, switchChain, waitForTransactionReceipt } from '@wagmi/core'
import { erc20Abi, parseUnits, zeroAddress } from 'viem'
import type { Address } from 'viem'

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
  const [bridgeSourceChainId, setBridgeSourceChainId] = useState<number>(
    SUPPORTED_ASSETS.networks.eth.id,
  )
  const balanceQuery = { enabled: Boolean(address), refetchInterval: 15_000 }
  const supportedNetworks = Object.values(SUPPORTED_ASSETS.networks)

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
                LI.FI didn&apos;t return any supported vaults that accept
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
  const selectedVaultTokenSymbol =
    selectedVault.underlyingTokens[0].symbol.toUpperCase()
  const selectedVaultNetwork = supportedNetworks.find(
    (network) => network.id === selectedVault.chainId,
  )
  const selectedSupportedToken = Object.values(SUPPORTED_ASSETS.tokens).find(
    (token) => token.symbol === selectedVaultTokenSymbol,
  )
  const selectedVaultDestinationChain =
    selectedVaultNetwork ?? supportedNetworks[0]
  const bridgeChainOptions = supportedNetworks.filter(
    (network) => network.id !== selectedVault.chainId,
  )
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

  const tokenBalancesBySymbol = {
    USDC: 0n,
    DAI: 0n,
    ETH: 0n,
  }

  supportedTokenBalances.data?.forEach((result, index) => {
    const tokenIndex = Math.floor(index / supportedNetworks.length)
    const token = Object.values(SUPPORTED_ASSETS.tokens).filter(
      (supportedToken) => supportedToken.symbol !== 'ETH',
    )[tokenIndex]

    if (result.status === 'success' && token) {
      tokenBalancesBySymbol[token.symbol] += result.result
    }
  })

  tokenBalancesBySymbol.ETH =
    (ethMainnetBalance.data?.value ?? 0n) +
    (ethBaseBalance.data?.value ?? 0n) +
    (ethOptimismBalance.data?.value ?? 0n)

  const selectedTokenDecimals = selectedSupportedToken?.decimals ?? 6
  const selectedVaultChainBalance =
    selectedVaultTokenSymbol === 'ETH'
      ? selectedVault.chainId === SUPPORTED_ASSETS.networks.eth.id
        ? (ethMainnetBalance.data?.value ?? 0n)
        : selectedVault.chainId === SUPPORTED_ASSETS.networks.base.id
          ? (ethBaseBalance.data?.value ?? 0n)
          : selectedVault.chainId === SUPPORTED_ASSETS.networks.optimism.id
            ? (ethOptimismBalance.data?.value ?? 0n)
            : 0n
      : (() => {
          const supportedErc20Tokens = Object.values(SUPPORTED_ASSETS.tokens)
            .filter((token) => token.symbol !== 'ETH')
          const tokenIndex = supportedErc20Tokens.findIndex(
            (token) => token.symbol === selectedVaultTokenSymbol,
          )
          const networkIndex = supportedNetworks.findIndex(
            (network) => network.id === selectedVault.chainId,
          )

          if (tokenIndex < 0 || networkIndex < 0) {
            return 0n
          }

          const result =
            supportedTokenBalances.data?.[
              tokenIndex * supportedNetworks.length + networkIndex
            ]

          return result?.status === 'success' ? result.result : 0n
        })()
  const requiredSelectedTokenAmount =
    currentAmountValue > 0
      ? parseUnits(currentAmount, selectedTokenDecimals)
      : 0n
  const missingDestinationAmount =
    selectedVaultChainBalance >= requiredSelectedTokenAmount
      ? 0n
      : requiredSelectedTokenAmount - selectedVaultChainBalance
  const hasInsufficientSupportedBalance =
    currentAmountValue > 0 &&
    selectedVaultChainBalance < requiredSelectedTokenAmount
  const selectedBridgeSourceChain =
    bridgeChainOptions.find((chain) => chain.id === bridgeSourceChainId) ??
    bridgeChainOptions[0]
  const isWalletOnSelectedBridgeChain = chainId === selectedBridgeSourceChain?.id

  const bridgeQuoteQuery = useQuery({
    queryKey: [
      'bridge-quote',
      address,
      bridgeSourceChainId,
      selectedVault.chainId,
      selectedVaultTokenSymbol,
      missingDestinationAmount.toString(),
    ],
    queryFn: async () => {
      const fromTokenAddress =
        selectedVaultTokenSymbol === 'ETH'
          ? zeroAddress
          : selectedSupportedToken &&
              'addresses' in selectedSupportedToken
            ? selectedSupportedToken.addresses[selectedBridgeSourceChain.key]
            : undefined
      const toTokenAddress =
        selectedVaultTokenSymbol === 'ETH'
          ? zeroAddress
          : selectedSupportedToken &&
              'addresses' in selectedSupportedToken
            ? selectedSupportedToken.addresses[selectedVaultDestinationChain.key]
            : undefined

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(
          `Unable to bridge ${selectedVaultTokenSymbol} for the selected route.`,
        )
      }

      let fromAmount = missingDestinationAmount
      let quote = await getBridgeQuote({
        data: {
          fromChain: bridgeSourceChainId,
          toChain: selectedVault.chainId,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          fromAddress: address!,
          toAddress: address!,
          fromAmount: fromAmount.toString(),
        },
      })

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const minimumReceived = quote.estimate.toAmountMin
          ? BigInt(quote.estimate.toAmountMin)
          : 0n

        if (minimumReceived >= missingDestinationAmount) {
          return quote
        }

        const shortfall = missingDestinationAmount - minimumReceived
        const bufferedShortfall = (shortfall * 105n) / 100n

        fromAmount += bufferedShortfall > 0n ? bufferedShortfall : 1n

        quote = await getBridgeQuote({
          data: {
            fromChain: bridgeSourceChainId,
            toChain: selectedVault.chainId,
            fromToken: fromTokenAddress,
            toToken: toTokenAddress,
            fromAddress: address!,
            toAddress: address!,
            fromAmount: fromAmount.toString(),
          },
        })
      }

      return quote
    },
    enabled:
      isBridgeModalOpen &&
      Boolean(address) &&
      missingDestinationAmount > 0n &&
      Boolean(selectedBridgeSourceChain),
    staleTime: 1000 * 30,
  })

  const bridgeFeeAmount = bridgeQuoteQuery.data?.estimate.feeCosts?.[0]
  const bridgeGasAmount = bridgeQuoteQuery.data?.estimate.gasCosts?.[0]

  const bridgeMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bridgeQuoteQuery.data) {
        throw new Error('Bridge quote missing')
      }

      if (chainId !== bridgeSourceChainId) {
        await switchChain(config, { chainId: bridgeSourceChainId })
      }

      const hash = await sendTransaction(config, {
        account: address,
        chainId: bridgeSourceChainId,
        to: bridgeQuoteQuery.data.transactionRequest.to as Address,
        data: bridgeQuoteQuery.data.transactionRequest.data,
        value: bridgeQuoteQuery.data.transactionRequest.value
          ? BigInt(bridgeQuoteQuery.data.transactionRequest.value)
          : 0n,
        gas: bridgeQuoteQuery.data.transactionRequest.gasLimit
          ? BigInt(bridgeQuoteQuery.data.transactionRequest.gasLimit)
          : undefined,
        gasPrice: bridgeQuoteQuery.data.transactionRequest.gasPrice
          ? BigInt(bridgeQuoteQuery.data.transactionRequest.gasPrice)
          : undefined,
        maxFeePerGas: bridgeQuoteQuery.data.transactionRequest.maxFeePerGas
          ? BigInt(bridgeQuoteQuery.data.transactionRequest.maxFeePerGas)
          : undefined,
        maxPriorityFeePerGas:
          bridgeQuoteQuery.data.transactionRequest.maxPriorityFeePerGas
            ? BigInt(
                bridgeQuoteQuery.data.transactionRequest.maxPriorityFeePerGas,
              )
            : undefined,
      })

      await waitForTransactionReceipt(config, {
        chainId: bridgeSourceChainId,
        hash,
      })

      return hash
    },
    onSuccess: async () => {
      setIsBridgeModalOpen(false)
      await Promise.all([
        ethMainnetBalance.refetch(),
        ethBaseBalance.refetch(),
        ethOptimismBalance.refetch(),
        supportedTokenBalances.refetch(),
      ])
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('Wallet or vault missing')
      }

      setGoalCreationStage('txHash')

      const fromAmount = parseUnits(currentAmount, 6).toString()

      const quote = await getComposerQuote({
        data: {
          fromChain: BASE_CHAIN_ID,
          toChain: selectedVault.chainId,
          fromToken: BASE_USDC_ADDRESS,
          toToken: selectedVault.address,
          fromAddress: address,
          toAddress: address,
          fromAmount,
        },
      })

      if (chainId !== BASE_CHAIN_ID) {
        await switchChain(config, { chainId: BASE_CHAIN_ID })
      }

      const txHash = await depositToVault({
        quote,
        account: address,
        chainId: BASE_CHAIN_ID,
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
      hasInsufficientSupportedBalance
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
      <BridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        amountNeeded={missingDestinationAmount}
        currentDestinationBalance={selectedVaultChainBalance}
        tokenSymbol={selectedVaultTokenSymbol}
        tokenDecimals={selectedTokenDecimals}
        destinationChainLabel={
          selectedVaultNetwork?.label ?? selectedVault.network
        }
        formatTokenBalance={formatTokenBalance}
        chainOptions={bridgeChainOptions.map((chain) => ({
          id: chain.id,
          label: chain.label,
        }))}
        selectedChainId={bridgeSourceChainId}
        onSelectChain={setBridgeSourceChainId}
        selectedChainLabel={selectedBridgeSourceChain?.label ?? 'Ethereum'}
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
      />
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
                        Initial deposit
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

                  {hasInsufficientSupportedBalance ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-medium">
                        Insufficient {selectedVaultTokenSymbol} balance
                      </p>
                      <p className="my-1 leading-5">
                        You have{' '}
                        {formatTokenBalance(
                          selectedVaultChainBalance,
                          selectedTokenDecimals,
                        )}{' '}
                        {selectedVaultTokenSymbol} on{' '}
                        {selectedVaultNetwork?.label ?? selectedVault.network},
                        but this deposit needs{' '}
                        {formatTokenBalance(
                          requiredSelectedTokenAmount,
                          selectedTokenDecimals,
                        )}{' '}
                        {selectedVaultTokenSymbol}.
                      </p>

                      <Button
                        type="button"
                        className="mt-2 w-full"
                        onClick={() => setIsBridgeModalOpen(true)}
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
                        hasInsufficientSupportedBalance
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
                  Live LI.FI Earn vaults showing the top depositable APY on
                  each supported chain.
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
                          {vault.underlyingTokens[0]?.symbol} •{' '}
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
                        {/* <div className="text-right text-[10px] leading-4">
                          <p>Base {formatPercent(vault.analytics.apy.base)}</p>
                          <p>
                            Reward {formatPercent(vault.analytics.apy.reward)}
                          </p>
                        </div> */}
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
