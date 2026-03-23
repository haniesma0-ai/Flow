import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardLayout from '@/layouts/DashboardLayout';

// Dashboard Pages
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import CommercialDashboard from '@/pages/dashboard/CommercialDashboard';
import ChauffeurDashboard from '@/pages/dashboard/ChauffeurDashboard';
import ClientDashboard from '@/pages/dashboard/ClientDashboard';

// Management Pages
import OrdersPage from '@/pages/orders/OrdersPage';
import OrderDetailPage from '@/pages/orders/OrderDetailPage';
import OrderFormPage from '@/pages/orders/OrderFormPage';
import ProductsPage from '@/pages/products/ProductsPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import DeliveriesPage from '@/pages/deliveries/DeliveriesPage';
import InvoicesPage from '@/pages/invoices/InvoicesPage';
import DiscountsPage from '@/pages/discounts/DiscountsPage';
import IncidentsPage from '@/pages/incidents/IncidentsPage';

// Feature Pages
import KanbanPage from '@/pages/kanban/KanbanPage';
import CalendarPage from '@/pages/calendar/CalendarPage';
import MapTrackingPage from '@/pages/tracking/MapTrackingPage';
import ReportsPage from '@/pages/reports/ReportsPage';

// Settings
import SettingsPage from '@/pages/settings/SettingsPage';
import ChauffeurSettingsPage from '@/pages/settings/ChauffeurSettingsPage';
import UsersPage from '@/pages/settings/UsersPage';

// Fleet
import VehiclesPage from '@/pages/vehicles/VehiclesPage';

// Careers Admin
import CareersAdminPage from '@/pages/careers/CareersAdminPage';

// Client Pages
import ClientCatalogPage from '@/pages/client/ClientCatalogPage';
import ClientOrdersPage from '@/pages/client/ClientOrdersPage';
import ClientProfilePage from '@/pages/client/ClientProfilePage';

// Offline
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import RegisterPage from '@/pages/RegisterPage';

// Public Pages
import CareersPage from '@/pages/public/CareersPage';
import NewsPage from '@/pages/public/NewsPage';
import LegalNoticePage from '@/pages/public/LegalNoticePage';
import PrivacyPolicyPage from '@/pages/public/PrivacyPolicyPage';
import TermsPage from '@/pages/public/TermsPage';

// ...existing code...

// Protected Route Component
const ProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { auth } = useAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user?.role || '')) {
    toast.error('Accès non autorisé');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Role-based Settings Router
const SettingsRouter = () => {
  const { auth } = useAuth();
  if (auth.user?.role === 'chauffeur') {
    return <ChauffeurSettingsPage />;
  }
  return <SettingsPage />;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
  const { auth } = useAuth();
  const role = auth.user?.role;

  switch (role) {
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'manager':
      return <Navigate to="/dashboard/admin" replace />;
    case 'commercial':
      return <Navigate to="/dashboard/commercial" replace />;
    case 'chauffeur':
      return <Navigate to="/dashboard/chauffeur" replace />;
    case 'client':
      return <Navigate to="/dashboard/client" replace />;
    case 'user':
      return <Navigate to="/dashboard/client" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  const { auth } = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/legal" element={<LegalNoticePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardRedirect />} />
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="commercial" element={
            <ProtectedRoute allowedRoles={['commercial', 'admin', 'manager']}>
              <CommercialDashboard />
            </ProtectedRoute>
          } />
          <Route path="chauffeur" element={
            <ProtectedRoute allowedRoles={['chauffeur', 'admin', 'manager']}>
              <ChauffeurDashboard />
            </ProtectedRoute>
          } />
          <Route path="client" element={
            <ProtectedRoute allowedRoles={['client', 'user']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          {/* Common Routes */}
          <Route path="orders" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="orders/new" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <OrderFormPage />
            </ProtectedRoute>
          } />
          <Route path="orders/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="orders/:id/edit" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <OrderFormPage />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="customers" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <CustomersPage />
            </ProtectedRoute>
          } />
          <Route path="deliveries" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial', 'chauffeur']}>
              <DeliveriesPage />
            </ProtectedRoute>
          } />
          <Route path="invoices" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <InvoicesPage />
            </ProtectedRoute>
          } />
          <Route path="discounts" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <DiscountsPage />
            </ProtectedRoute>
          } />
          <Route path="incidents" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'chauffeur']}>
              <IncidentsPage />
            </ProtectedRoute>
          } />
          {/* Feature Routes */}
          <Route path="kanban" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <KanbanPage />
            </ProtectedRoute>
          } />
          <Route path="calendar" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial']}>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="tracking" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MapTrackingPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          {/* Client-specific routes */}
          <Route path="catalog" element={
            <ProtectedRoute allowedRoles={['client', 'user']}>
              <ClientCatalogPage />
            </ProtectedRoute>
          } />
          <Route path="my-orders" element={
            <ProtectedRoute allowedRoles={['client', 'user']}>
              <ClientOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute allowedRoles={['client', 'user']}>
              <ClientProfilePage />
            </ProtectedRoute>
          } />
          {/* Settings */}
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'commercial', 'chauffeur']}>
              <SettingsRouter />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="vehicles" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VehiclesPage />
            </ProtectedRoute>
          } />
          <Route path="careers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CareersAdminPage />
            </ProtectedRoute>
          } />
        </Route>
        {/* Auth and public routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
      <OfflineIndicator />
    </BrowserRouter>
  );
}

export default App;
