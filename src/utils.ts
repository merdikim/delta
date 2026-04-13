import { formatUnits } from 'viem'
import type { Address } from 'viem'

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

export function formatCompactUsd(value: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value))
}

export function formatUsd(value: number) {
  const hasCents = Math.abs(value % 1) > Number.EPSILON

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export const confettiPieces = [
  {
    left: '8%',
    delay: '0s',
    duration: '2.6s',
    color: '#22c55e',
    rotate: '-12deg',
  },
  {
    left: '18%',
    delay: '0.15s',
    duration: '2.9s',
    color: '#0ea5e9',
    rotate: '10deg',
  },
  {
    left: '29%',
    delay: '0.35s',
    duration: '2.5s',
    color: '#f59e0b',
    rotate: '-8deg',
  },
  {
    left: '41%',
    delay: '0.1s',
    duration: '3.1s',
    color: '#f43f5e',
    rotate: '14deg',
  },
  {
    left: '53%',
    delay: '0.45s',
    duration: '2.7s',
    color: '#14b8a6',
    rotate: '-14deg',
  },
  {
    left: '65%',
    delay: '0.2s',
    duration: '3s',
    color: '#a855f7',
    rotate: '8deg',
  },
  {
    left: '77%',
    delay: '0.55s',
    duration: '2.8s',
    color: '#22c55e',
    rotate: '-10deg',
  },
  {
    left: '89%',
    delay: '0.3s',
    duration: '2.6s',
    color: '#fb7185',
    rotate: '12deg',
  },
]

export const BASE_CHAIN_ID = 8453
export const BASE_USDC_ADDRESS =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

export const SUPPORTED_ASSETS = {
  networks: {
    eth: {
      id: 1,
      key: 'eth',
      label: 'Ethereum',
    },
    base: {
      id: 8453,
      key: 'base',
      label: 'Base',
    },
    optimism: {
      id: 10,
      key: 'optimism',
      label: 'Optimism',
    },
  },
  tokens: {
    usdc: {
      symbol: 'USDC',
      label: 'USD Coin',
      decimals: 6,
      addresses: {
        eth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
        base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
        optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address,
      },
    },
    dai: {
      symbol: 'DAI',
      label: 'Dai',
      decimals: 18,
      addresses: {
        eth: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
        base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
        optimism: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as Address,
      },
    },
    eth: {
      symbol: 'ETH',
      label: 'Ether',
      decimals: 18,
    },
  },
} as const

export const BRIDGEABLE_CHAINS = {
  1: {
    label: 'Ethereum',
    usdcAddress: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Address,
  },
  10: {
    label: 'Optimism',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CaF62653d097Ff85' as Address,
  },
} as const

export const DEFAULT_BRIDGE_SOURCE_CHAIN_ID = 1

export function formatTokenBalance(
  value: bigint | undefined,
  decimals: number,
) {
  if (value === undefined) {
    return '--'
  }

  const formatted = Number(formatUnits(value, decimals))
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: formatted >= 100 ? 2 : 4,
  }).format(formatted)
}

export function getBridgeableChain(chainId?: number) {
  if (!chainId) {
    return undefined
  }

  return BRIDGEABLE_CHAINS[chainId as keyof typeof BRIDGEABLE_CHAINS]
}

export function formatDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function truncate(value: string, length = 3) {
  if (value.length <= length) {
    return value
  }

  return `${value.slice(0, length)}...${value.slice(-length)}`
}

export const DEFAULT_PROFILE =
  'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png'
