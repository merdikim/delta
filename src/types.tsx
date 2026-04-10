export type Goal = {
  name: string
  createdAt: number
}

export type EarnVaultApy = {
  base: number
  total: number
  reward: number
}

export type EarnVaultTvl = {
  usd: string
}

export type EarnVaultAnalytics = {
  apy: EarnVaultApy
  tvl: EarnVaultTvl
  apy1d?: number
  apy7d?: number
  apy30d?: number
  updatedAt?: string
}

export type EarnVaultProtocol = {
  name: string
  url?: string
}

export type EarnVaultUnderlyingToken = {
  symbol: string
  address: string
  decimals: number
}

export type EarnVaultLpToken = {
  chainId?: number
  address?: string
  symbol?: string
  decimals?: number
}

export type EarnVaultPack = {
  name: string
  stepsType: string
}

export type EarnVault = {
  name: string
  slug: string
  tags: string[]
  address: string
  chainId: number
  network: string
  lpTokens: EarnVaultLpToken[]
  protocol: EarnVaultProtocol
  provider: string
  syncedAt: string
  analytics: EarnVaultAnalytics
  description?: string
  redeemPacks: EarnVaultPack[]
  depositPacks: EarnVaultPack[]
  isRedeemable: boolean
  isTransactional: boolean
  underlyingTokens: EarnVaultUnderlyingToken[]
}

export type EarnVaultsResponse = {
  data: EarnVault[]
  nextCursor?: string
  total?: number
}
