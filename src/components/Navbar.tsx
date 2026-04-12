import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

const Navbar = () => {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Wallet not connected'

  return (
    <>
      <div className="h-(--navbar-height) w-full flex justify-between items-center border-b-2 border-b-border">
        <Link to="/home">
          <img
            src="https://pngimg.com/d/triangle_PNG102.png"
            alt="Delta"
            className="h-12 w-12"
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="overflow-hidden rounded-full border border-border transition hover:scale-[1.02] hover:shadow-md"
          aria-label="Open wallet menu"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            alt={address}
            className="h-12 w-12 rounded-full object-cover"
          />
        </button>
      </div>

      {isProfileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Wallet</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close wallet menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                  alt={address}
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">Connected address</p>
                  <p className="truncate text-base font-semibold text-slate-950">
                    {shortAddress}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Disconnect this wallet to lock protected routes until a wallet is
              connected again.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setIsProfileOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
                onClick={() => {
                  disconnect()
                  setIsProfileOpen(false)
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Navbar
