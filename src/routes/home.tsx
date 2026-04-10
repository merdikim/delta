import HomePage from '#/pages/dashboard/HomePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
})

function Home() {
  return <HomePage />
}
