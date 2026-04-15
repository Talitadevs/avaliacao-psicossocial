import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import MainApp from './MainApp'
import RegisterInvite from './pages/RegisterInvite'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MainApp />} />
        <Route
          path="/register/:token"
          element={<RegisterInvite />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App