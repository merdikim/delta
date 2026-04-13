import Navbar from '#/components/Navbar'
import Authenticated from '#/guards/authenticated'
import HomePage from '#/pages/dashboard/HomePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home')({
  component: Home,
})

function Home() {
  return (
    <Authenticated>
      <Navbar/>
      <HomePage />
    </Authenticated>
  )
}
