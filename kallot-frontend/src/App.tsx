import AddKallot from './pages/addKallaPage'
import EditKalla from './pages/editKallaPage'
import Home from './pages/homePage'
import Login from './pages/loginPage'
import NotFound from './pages/notFoundPage'
import Register from './pages/registerPage'
import Layout from './components/layout'
import ProtectedRoute from './components/protectedRoute'
import GuestRoute from './components/guestRoute'
import { Routes, Route } from 'react-router-dom'


function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route element={<ProtectedRoute roles={["REP", "ADMIN"]} />}>
            <Route path="/kallot/new" element={<AddKallot />} />
            <Route path="/kallot/:id/edit" element={<EditKalla />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App