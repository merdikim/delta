import SectionBadge from '#/components/cards/SectionBadge'
import { Button } from '#/components/ui/button'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Link, Navigate, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck, Wallet, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'

export const Route = createFileRoute('/connect')({
  component: ConnectWallet,
})

function ConnectWallet() {
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()

  if (isConnected) {
    return <Navigate to="/home" />
  }

  return (
    <main className="relative h-screen px-6 py-10 text-slate-950">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center justify-center">
          <section className="max-w-2xl hidden lg:block">
            <SectionBadge text='Secure wallet sign-in for your goal vault' badge={<ShieldCheck className="size-4" />}/>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
              Connect your wallet and start tracking your next big move.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Delta uses your wallet as the key to your dashboard, goals, and
              future yield strategies. Connect once and pick up right where your
              planning begins.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Wallet className="mb-3 size-5 text-emerald-700" />
                Wallet-based access
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <ShieldCheck className="mb-3 size-5 text-emerald-700" />
                Private goal management
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Zap className="mb-3 size-5 text-emerald-700" />
                Faster entry into DeFi flows
              </div>
            </div>
          </section>

          <section className="rounded-4xl w-full max-w-md border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
            <div className="rounded-3xl p-6 sm:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Wallet required
                  </h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <Wallet className="size-6 text-primary" />
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-900">
                You are one step away from your dashboard. Connect a supported
                wallet to continue to your protected routes.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-900">
                <p className="font-medium">What happens next</p>
                <p className="mt-2">
                  After connecting, you will be redirected straight into your
                  app experience and can access every protected page.
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={openConnectModal}
                className="mt-8 h-12 w-full rounded-xl bg-primary text-white hover:bg-emerald-900"
              >
                <Wallet className="size-4 text-white" />
                Connect Wallet
              </Button>

              <Button
                asChild
                variant="link"
                size="lg"
                className="mt-3 h-12 w-full rounded-xl hover:bg-white/10"
              >
                <Link to="/">
                  <ArrowLeft className="size-4" />
                  Back to landing page
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
