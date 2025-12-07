import { Routes, Route } from 'react-router-dom'
import AuthPage from './components/AuthPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
    </Routes>
  )
}

export default App
