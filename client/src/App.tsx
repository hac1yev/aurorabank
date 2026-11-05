import { Route, Routes } from "react-router-dom"
import { RegistrationStepper } from "./pages/Registration"
import { LoginPage } from "./pages/Login"
import { HomePage } from "./pages/Home"

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<RegistrationStepper />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
