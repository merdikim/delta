import { getContext } from '#/integrations/tanstack-query/root-provider'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, WagmiProvider } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

const { queryClient } = getContext()
const config = getDefaultConfig({
  appName: 'Delta',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
    [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
    [optimism.id]: http('https://optimism-rpc.publicnode.com'),
    [arbitrum.id]: http('https://arbitrum-one-rpc.publicnode.com'),
    [base.id]: http('https://base-rpc.publicnode.com'),
  },
})

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
