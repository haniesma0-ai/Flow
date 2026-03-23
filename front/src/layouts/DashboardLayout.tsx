import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  FileText, KanbanSquare, Calendar, MapPin, BarChart3,
  Settings, UserCog, LogOut, Menu, X, ChevronDown,
  Search, Car, Briefcase, Percent, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/NotificationDropdown';

const DashboardLayout = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const user = auth.user;
  const userRole = user?.role || 'commercial';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardHref = userRole === 'admin' || userRole === 'manager'
    ? '/dashboard/admin'
    : userRole === 'chauffeur'
      ? '/dashboard/chauffeur'
      : userRole === 'client' || userRole === 'user'
        ? '/dashboard/client'
        : '/dashboard/commercial';

  const navigation = [
    {
      name: t('nav.dashboard'),
      href: dashboardHref,
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'commercial', 'chauffeur', 'client', 'user'],
    },
    {
      name: t('nav.orders'),
      href: '/dashboard/orders',
      icon: ShoppingCart,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.catalog'),
      href: '/dashboard/catalog',
      icon: Package,
      roles: ['client', 'user'],
    },
    {
      name: t('nav.myOrders'),
      href: '/dashboard/my-orders',
      icon: ShoppingCart,
      roles: ['client', 'user'],
    },
    {
      name: t('nav.products'),
      href: '/dashboard/products',
      icon: Package,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.customers'),
      href: '/dashboard/customers',
      icon: Users,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.deliveries'),
      href: '/dashboard/deliveries',
      icon: Truck,
      roles: ['admin', 'manager', 'commercial', 'chauffeur'],
    },
    {
      name: t('nav.invoices'),
      href: '/dashboard/invoices',
      icon: FileText,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.discounts'),
      href: '/dashboard/discounts',
      icon: Percent,
      roles: ['admin', 'manager'],
    },
    {
      name: t('nav.incidents'),
      href: '/dashboard/incidents',
      icon: AlertTriangle,
      roles: ['admin', 'manager', 'chauffeur'],
    },
    {
      name: t('nav.kanban'),
      href: '/dashboard/kanban',
      icon: KanbanSquare,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.calendar'),
      href: '/dashboard/calendar',
      icon: Calendar,
      roles: ['admin', 'manager', 'commercial'],
    },
    {
      name: t('nav.tracking'),
      href: '/dashboard/tracking',
      icon: MapPin,
      roles: ['admin', 'manager'],
    },
    {
      name: t('nav.reports'),
      href: '/dashboard/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      name: t('nav.vehicles'),
      href: '/dashboard/vehicles',
      icon: Car,
      roles: ['admin'],
    },
    {
      name: t('nav.careers'),
      href: '/dashboard/careers',
      icon: Briefcase,
      roles: ['admin'],
    },
    {
      name: t('nav.users'),
      href: '/dashboard/users',
      icon: UserCog,
      roles: ['admin'],
    },
    {
      name: t('nav.settings'),
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'commercial', 'chauffeur'],
    },
    {
      name: t('nav.profile'),
      href: '/dashboard/profile',
      icon: Settings,
      roles: ['client', 'user'],
    },
  ];

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Fox Petroleum" className="w-10 h-10 object-contain" />
            </div>
            {isSidebarOpen && (
              <div>
                <span className="font-bold text-slate-900">FoxPetroleum</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              title={!isSidebarOpen ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <Button
              variant="ghost"
              className="w-full mt-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('layout.logout')}
            </Button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50"
        >
          <ChevronDown
            className={`w-3 h-3 text-slate-500 transition-transform ${isSidebarOpen ? 'rotate-90' : '-rotate-90'
              }`}
          />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Fox Petroleum" className="w-10 h-10 object-contain" />
                </div>
                <span className="font-bold text-slate-900">Fox Petroleum</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('layout.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
              {filteredNavigation.find((item) => isActive(item.href))?.name || t('nav.dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder={t('layout.search')}
                className="bg-transparent border-none outline-none text-sm w-48"
              />
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Mobile User */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
