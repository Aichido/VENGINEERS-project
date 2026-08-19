import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import PublicLayout from './layouts/PublicLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import { ToastProvider } from './context/ToastContext'

// Public pages
import Home from './pages/public/Home'
import About from './pages/public/About'
import Products from './pages/public/Products'
import ProductDetail from './pages/public/ProductDetail'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import Cart from './pages/public/Cart'

// Dashboard Client (Phase 3)
import ClientDashboard from './pages/dashboards/client/ClientDashboard';
import Interventions from './pages/dashboards/client/Interventions'
import InterventionNew from './pages/dashboards/client/InterventionNew'
import Orders from './pages/dashboards/client/Orders'
import OrderDetail from './pages/dashboards/client/OrderDetail'

// Dashboard Commercial (Phase 4)
import CommercialDashboard from './pages/dashboards/commercial/CommercialDashboard';
import CommercialOrders from './pages/dashboards/commercial/Orders';
import CommercialStock from './pages/dashboards/commercial/Stock';
import CommercialOrderDetail from './pages/dashboards/commercial/OrderDetail';

// Dashboard Technicien (Phase 5)
import TechnicienDashboard from './pages/dashboards/technicien/TechnicienDashboard';
import TechnicienInterventions from './pages/dashboards/technicien/Interventions';
import TechnicienInterventionDetail from './pages/dashboards/technicien/InterventionDetail';
import TechnicienReportHistory from './pages/dashboards/technicien/ReportHistory';

// Dashboard Admin (Phase 6)
import AdminDashboard from './pages/dashboards/admin/AdminDashboard';
import Users from './pages/dashboards/admin/Users';
import Categories from './pages/dashboards/admin/Categories';
import ProductAdmin from './pages/dashboards/admin/Products';
import ProductForm from './pages/dashboards/admin/ProductForm';
import InterventionAssignment from './pages/dashboards/admin/InterventionAssignment';
import Reports from './pages/dashboards/admin/Reports';

function App() {
  return (
    <AuthProvider>
       <CartProvider>
        <ToastProvider>
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
          <Route path="cart" element={<Cart />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route element={<DashboardLayout />}>
             <Route path="/client" element={<ClientDashboard />} />
             <Route path="/client/interventions" element={<Interventions />} />
             <Route path="/client/interventions/new" element={<InterventionNew />} />
             <Route path="/client/orders" element={<Orders />} />
              <Route path="/client/orders/:publicId" element={<OrderDetail />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['commercial']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/commercial" element={<CommercialDashboard />} />
            <Route path="/commercial/orders" element={<CommercialOrders />} />
            <Route path="/commercial/stock" element={<CommercialStock />} />
            <Route path="/commercial/orders/:publicId" element={<CommercialOrderDetail />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['technicien']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/technicien" element={<TechnicienDashboard />} />
            <Route path="/technicien/interventions" element={<TechnicienInterventions />} />
            <Route path="/technicien/interventions/:publicId" element={<TechnicienInterventionDetail />} />
            <Route path="/technicien/reports" element={<TechnicienReportHistory />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/products" element={<ProductAdmin />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:id/edit" element={<ProductForm />} />
            <Route path="/admin/interventions" element={<InterventionAssignment />} />
            <Route path="/admin/reports" element={<Reports />} />
            {/* /admin/users, /admin/products, /admin/categories, /admin/interventions
                à ajouter au fur et à mesure des prochaines sous-étapes 6.7 */}
          </Route>
        </Route>
      </Routes>
      </ToastProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App