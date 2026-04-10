import { useEnsName } from "wagmi"

const Navbar = () => {
  const {} = useEnsName()
  return (
    <div className="h-(--navbar-height) w-full flex justify-between items-center border-b-2 border-b-border">
      <img src="" alt="Delta" className="h-16 w-16 bg-black" />
      <p>merkim.eth</p>
    </div>
  )
}

export default Navbar
