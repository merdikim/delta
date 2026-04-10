import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return(
    <div className='h-screen w-screen flex justify-center items-center flex-col gap-y-4'>
      <h1 className='font-semibold text-3xl'>Delta</h1>
      <p>DeFI is the gate to your financial freedom</p>
      <Link className='border-b border-b-blue-600' to={"/home"}>Start Now</Link>
    </div>
  )
}
