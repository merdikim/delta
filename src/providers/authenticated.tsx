import { Button } from '@/components/ui/button'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

type TAuthenticated = {
  children: React.ReactNode
}

export default function Authenticated({ children }: TAuthenticated) {
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()

  // const handleConnect = async () => {
  //   try {
  //     await connect();
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  if (isConnected) {
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

  return <>{children}</>
}
