import { Link } from "react-router-dom"

export const HomePage = () => {
  return (
    <div>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
    </div>
  )
}

