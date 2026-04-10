import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient()

  return {
    queryClient,
    wallet: {
      isConnected: false,
      isConnecting: false,
      address: undefined,
    },
  }
}
export default function TanstackQueryProvider() {}
