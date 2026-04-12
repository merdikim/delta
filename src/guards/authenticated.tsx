import { useAccount } from 'wagmi'
import { Navigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export default function Authenticated({ children }: { children: ReactNode }) {
  const { isConnected, isConnecting } = useAccount()

  if (isConnecting) {
    return null
  }

  if (!isConnected) {
    return <Navigate to="/connect" />
  }

  return <>{children}</>
}
