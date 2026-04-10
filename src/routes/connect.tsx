import { Button } from '#/components/ui/button'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { createFileRoute } from '@tanstack/react-router'
import { useAccount } from 'wagmi'

export const Route = createFileRoute('/connect')({
  component: ConnectWallet,
})

function ConnectWallet() {
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()

  return (
    <div className="flex h-[calc(100vh-var(--height-nav))] w-screen flex-col items-center justify-center">
      <p className="mb-10 text-lg font-bold sm:text-xl lg:text-5xl">
        Shhnobs, You are not connected...
      </p>
      <Button variant="default" onClick={openConnectModal}>
        {' '}
        Connect Wallet
      </Button>
    </div>
  )
}
