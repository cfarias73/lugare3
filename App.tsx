
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { UserProvider } from './context/UserContext';
import { useRealtimeNotifications } from './src/hooks/useRealtimeNotifications';
import ErrorBoundary from './components/ErrorBoundary';
import AnalyticsTracker from './components/AnalyticsTracker';
import ProtectedRoute from './components/ProtectedRoute';
import RouteWrapper from './components/RouteWrapper';
import Welcome from './pages/Welcome';
import PublicInvitation from './pages/PublicInvitation';
import Privacy from './pages/Privacy';

const NotificationHandler = () => {
  useRealtimeNotifications();
  return null;
};

// User (Guest) Pages
import UserLogin from './pages/user/Login';
import UserHome from './pages/user/Home';
import ExploreMap from './pages/user/ExploreMap';
import VenueDetail from './pages/user/VenueDetail';
import BookingCalendar from './pages/user/BookingCalendar';
import Favorites from './pages/user/Favorites';
import Checkout from './pages/user/Checkout';
import PaymentSuccess from './pages/user/PaymentSuccess';
import Messages from './pages/user/Messages';
import Bookings from './pages/user/Bookings';
import Profile from './pages/user/Profile';
import Notifications from './pages/user/Notifications';
import RateExperience from './pages/user/RateExperience';
import CreateInvitation from './pages/user/invitations/CreateInvitation';
import AddGuests from './pages/user/invitations/AddGuests';
import SendInvitation from './pages/user/invitations/SendInvitation';
import UserForgotPassword from './pages/user/ForgotPassword';

// Provider (Host) Pages
import ProviderLogin from './pages/provider/Login';
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderMySpaces from './pages/provider/MySpaces';
import ProviderCreateSpace from './pages/provider/CreateSpace';
import ProviderProfile from './pages/provider/Profile';
import ProviderAdditionalServices from './pages/provider/AdditionalServices';
import ProviderCalendar from './pages/provider/AvailabilityCalendar';
import ProviderMessages from './pages/provider/Messages';
import ProviderReceivedBookings from './pages/provider/ReceivedBookings';
import ProviderStats from './pages/provider/Stats';
import ProviderNotifications from './pages/provider/Notifications';
import ProviderForgotPassword from './pages/provider/ForgotPassword';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminHosts from './pages/admin/Hosts';
import AdminSpaces from './pages/admin/Spaces';
import AdminBookings from './pages/admin/Bookings';
import AdminDisputes from './pages/admin/Disputes';
import AdminSettings from './pages/admin/Settings';
import AdminCategories from './pages/admin/Categories';
import AdminFinance from './pages/admin/Finance';
import AdminReviews from './pages/admin/Reviews';
import AdminPayouts from './pages/admin/Payouts';
import SplashScreen from './components/SplashScreen';
import { Capacitor } from '@capacitor/core';
import AuthRecoveryHandler from './components/AuthRecoveryHandler';
import ResetPassword from './pages/ResetPassword';
import { useUser } from './context/UserContext';
import { getRoleHomePath } from './src/utils/authRoutes';

const EntryPoint: React.FC = () => {
  const { user, authReady } = useUser();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background-dark text-sm font-medium text-slate-500">
        Restaurando tu sesión…
      </div>
    );
  }

  if (user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <RouteWrapper><Welcome /></RouteWrapper>;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(() => Capacitor.isNativePlatform());

  return (
    <UserProvider>
      {showSplash && <SplashScreen durationMs={3000} onFinish={() => setShowSplash(false)} />}
      <NotificationHandler />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            marginTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
          },
        }}
      />
      <ErrorBoundary>
        <Router>
          <AuthRecoveryHandler />
          <AnalyticsTracker />
          <Routes>
          {/* Entry Point */}
          <Route path="/" element={<EntryPoint />} />
          <Route path="/invite/:id" element={<RouteWrapper><PublicInvitation /></RouteWrapper>} />
          <Route path="/aviso-de-privacidad" element={<RouteWrapper><Privacy /></RouteWrapper>} />

        {/* User Application Routes */}
        <Route path="/user/login" element={<RouteWrapper><UserLogin /></RouteWrapper>} />
          <Route path="/user/forgot-password" element={<RouteWrapper><UserForgotPassword /></RouteWrapper>} />
          <Route path="/reset-password" element={<RouteWrapper><ResetPassword /></RouteWrapper>} />
        {/* Public Browsing Routes (Guest Mode) */}
        <Route path="/user/home" element={<RouteWrapper><UserHome /></RouteWrapper>} />
        <Route path="/user/explore" element={<RouteWrapper><ExploreMap /></RouteWrapper>} />
        <Route path="/user/venue/:id" element={<RouteWrapper><VenueDetail /></RouteWrapper>} />
        {/* Account-based Protected Routes */}
        <Route path="/user/booking/:id" element={<ProtectedRoute allowedRole="user"><RouteWrapper><BookingCalendar /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/favorites" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Favorites /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/checkout/:id" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Checkout /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/payment-success" element={<ProtectedRoute allowedRole="user"><RouteWrapper><PaymentSuccess /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/messages" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Messages /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/bookings" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Bookings /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Profile /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/notifications" element={<ProtectedRoute allowedRole="user"><RouteWrapper><Notifications /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/rate" element={<ProtectedRoute allowedRole="user"><RouteWrapper><RateExperience /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/invitations/create" element={<ProtectedRoute allowedRole="user"><RouteWrapper><CreateInvitation /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/invitations/guests" element={<ProtectedRoute allowedRole="user"><RouteWrapper><AddGuests /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/invitations/send" element={<ProtectedRoute allowedRole="user"><RouteWrapper><SendInvitation /></RouteWrapper></ProtectedRoute>} />

        {/* Provider Application Routes */}
        <Route path="/provider/login" element={<RouteWrapper><ProviderLogin /></RouteWrapper>} />
        <Route path="/provider/forgot-password" element={<RouteWrapper><ProviderForgotPassword /></RouteWrapper>} />
        <Route path="/provider/dashboard" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderDashboard /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/spaces" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderMySpaces /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/create-space" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderCreateSpace /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/profile" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderProfile /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/services" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderAdditionalServices /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/calendar" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderCalendar /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/messages" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderMessages /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/received-bookings" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderReceivedBookings /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/stats" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderStats /></RouteWrapper></ProtectedRoute>} />
        <Route path="/provider/notifications" element={<ProtectedRoute allowedRole="provider"><RouteWrapper><ProviderNotifications /></RouteWrapper></ProtectedRoute>} />

        {/* Admin Application Routes */}
        <Route path="/admin/login" element={<RouteWrapper><AdminLogin /></RouteWrapper>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminDashboard /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminUsers /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/hosts" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminHosts /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/spaces" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminSpaces /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminBookings /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminDisputes /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminSettings /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminCategories /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/finance" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminFinance /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminPayouts /></RouteWrapper></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute allowedRole="admin"><RouteWrapper><AdminReviews /></RouteWrapper></ProtectedRoute>} />


        {/* Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ErrorBoundary>
    </UserProvider>
  );
};

export default App;
