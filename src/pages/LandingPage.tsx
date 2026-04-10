import { Link } from '@tanstack/react-router'

const LandingPage = () => {
  return (
    <div className="h-screen w-screen flex justify-center items-center flex-col gap-y-4">
      <h1 className="font-semibold text-5xl">Your Financial Goals Made <span className='text-green-600'>Possible</span> With DeFI Yield</h1>
      <p>Whether you want to buy that house, or that car; DeFI yield gets you there faster</p>
      <p>Set Your Target -- Deposit funds -- Watch your funds grow till you reach your target</p>
      <Link className="border-b border-b-blue-600" to={'/home'}>
        Start Now
      </Link>
    </div>
  )
}

export default LandingPage
