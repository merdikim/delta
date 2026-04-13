import { Button } from '#/components/ui/button'
import { DEFAULT_PROFILE, truncate } from '#/utils'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'

const Navbar = () => {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address, chainId: 1 })
  const { data: ensAvatar, isLoading: isLoadingProfileImage } = useEnsAvatar({
    name: ensName || '',
    chainId: 1,
  })
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      <div className="h-(--navbar-height) w-full flex justify-between items-center border-b-2 border-b-slate-200 px-6">
        <Link to="/home">
          <img
            src="https://w7.pngwing.com/pngs/219/153/png-transparent-delta-circle-mathematics-greek-alphabet-symbol-circle-text-logo-number.png"
            alt="Delta"
            className="h-8 w-8"
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="relative overflow-hidden rounded-full border border-border transition hover:scale-[1.02] hover:shadow-md"
          aria-label="Open wallet menu"
        >
          {isLoadingProfileImage ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <LoaderCircle className="size-4 animate-spin text-slate-500" />
            </div>
          ) : null}
          <img
            src={ensAvatar ?? DEFAULT_PROFILE}
            alt={address}
            className="h-8 w-8 rounded-full object-cover"
          />
        </button>
      </div>

      {isProfileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
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
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200">
                  {isLoadingProfileImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <LoaderCircle className="size-5 animate-spin text-slate-500" />
                    </div>
                  ) : null}
                  <img
                    src={ensAvatar ?? DEFAULT_PROFILE}
                    alt={address}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">Connected address</p>
                  <p className="truncate text-base font-semibold text-slate-950">
                    {ensName ?? truncate(address!, 6)}
                  </p>
                </div>
              </div>
            </div>
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
