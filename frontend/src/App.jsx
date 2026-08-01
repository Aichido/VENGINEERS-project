import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'

// Public pages
import Home from './pages/public/Home'
import About from './pages/public/About'
import Products from './pages/public/Products'
import ProductDetail from './pages/public/ProductDetail'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Login from './pages/public/Login'
import Register from './pages/public/Register'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/*
          Dashboards privés (Phases 3 à 6) — à activer au fur et à mesure :

          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="client/*" element={<ClientDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['commercial']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="commercial/*" element={<CommercialDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['technicien']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="technicien/*" element={<TechnicienDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="admin/*" element={<AdminDashboard />} />
            </Route>
          </Route>
        */}
      </Routes>
    </AuthProvider>
  )
}

export default App