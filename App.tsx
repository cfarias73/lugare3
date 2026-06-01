
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

const App: React.FC = () => {
  return (
    <UserProvider>
      <NotificationHandler />
      <Toaster position="top-center" richColors />
      <ErrorBoundary>
        <Router>
          <AnalyticsTracker />
          <Routes>
          {/* Entry Point */}
          <Route path="/" element={<RouteWrapper><Welcome /></RouteWrapper>} />
          <Route path="/invite/:id" element={<RouteWrapper><PublicInvitation /></RouteWrapper>} />

        {/* User Application Routes */}
        <Route path="/user/login" element={<RouteWrapper><UserLogin /></RouteWrapper>} />
        <Route path="/user/forgot-password" element={<RouteWrapper><UserForgotPassword /></RouteWrapper>} />
        <Route path="/user/home" element={<ProtectedRoute allowedRole="user"><RouteWrapper><UserHome /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/explore" element={<ProtectedRoute allowedRole="user"><RouteWrapper><ExploreMap /></RouteWrapper></ProtectedRoute>} />
        <Route path="/user/venue/:id" element={<ProtectedRoute allowedRole="user"><RouteWrapper><VenueDetail /></RouteWrapper></ProtectedRoute>} />
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

        {/* Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ErrorBoundary>
    </UserProvider>
  );
};

export default App;
