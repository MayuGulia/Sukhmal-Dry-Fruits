import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthProvider } from '@/contexts/AuthContext';

import Home from '@/pages/Home';
import Search from '@/pages/Search';
import PLP from '@/pages/PLP';
import PDP from '@/pages/PDP';
import GiftHampers from '@/pages/GiftHampers';
import GiftHamperDetail from '@/pages/GiftHamperDetail';
import Wedding from '@/pages/Wedding';
import Corporate from '@/pages/Corporate';
import Festival from '@/pages/Festival';
import Offers from '@/pages/Offers';
import BuildHamper from '@/pages/BuildHamper';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess, { OrderFailed } from '@/pages/OrderSuccess';
import TrackOrder from '@/pages/TrackOrder';
import Wishlist from '@/pages/Wishlist';
import AuthPage from '@/pages/AuthPage';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import { StoreLocator, PolicyPage, FAQs, NotFound } from '@/pages/ContentPages';
import { AccountLayout, Dashboard as AccountDashboard, MyOrders, OrderDetail, ReturnOrder, Addresses, PaymentMethods, Loyalty, ProfileSettings } from '@/pages/account/Account';
import { AdminLayout, AdminDashboard } from '@/pages/admin/Admin';
import { AdminProducts, AdminOrders, AdminInventory, AdminPayments, AdminSettings } from '@/pages/admin/AdminPages';
import { RequireAuth, RequireAdmin, PublicOnly } from '@/components/auth/AuthGate';

import { Toaster } from 'sonner';
import './App.css';

// Scroll-to-top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Shell({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
                <Route path="/signup" element={<PublicOnly><AuthPage mode="signup" /></PublicOnly>} />
                <Route path="/forgot-password" element={<PublicOnly><AuthPage mode="forgot" /></PublicOnly>} />

                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="ai-inventory" element={<AdminInventory />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="customers" element={<Navigate to="/admin/orders" replace />} />
                  <Route path="offers" element={<Navigate to="/admin/settings" replace />} />
                </Route>

                <Route path="*" element={<Shell><CustomerRoutes /></Shell>} />
              </Routes>
            </BrowserRouter>
            <Toaster position="top-center" richColors />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </div>
  );
}

function CustomerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/category/:slug" element={<PLP />} />
      <Route path="/product/:slug" element={<PDP />} />
      <Route path="/products/:slug" element={<PDP />} />
      <Route path="/gift-hampers" element={<GiftHampers />} />
      <Route path="/gift-hampers/:slug" element={<GiftHamperDetail />} />
      <Route path="/wedding-gifts" element={<Wedding />} />
      <Route path="/corporate-gifts" element={<Corporate />} />
      <Route path="/festival-collections" element={<Festival />} />
      <Route path="/offers" element={<Offers />} />

      {/* Build Your Own Hamper wizard */}
      <Route path="/build-hamper" element={<Navigate to="/build-hamper/budget" replace />} />
      <Route path="/build-hamper/:step" element={<BuildHamper />} />

      {/* Cart / Checkout */}
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="/order-success/:orderId" element={<OrderSuccess />} />
      <Route path="/order-failed/:orderId" element={<OrderFailed />} />
      <Route path="/track-order" element={<TrackOrder />} />

      {/* Wishlist */}
      <Route path="/wishlist" element={<Wishlist />} />

      {/* Auth */}
      <Route path="/verify-otp" element={<Navigate to="/login" replace />} />

      {/* Account */}
      <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
        <Route index element={<AccountDashboard />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        <Route path="orders/:orderId/return" element={<ReturnOrder />} />
        <Route path="order-history" element={<MyOrders history />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="settings" element={<ProfileSettings />} />
      </Route>

      {/* Content */}
      <Route path="/about-us" element={<About />} />
      <Route path="/contact-us" element={<Contact />} />
      <Route path="/store-locator" element={<StoreLocator />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/shipping-delivery" element={<PolicyPage pageKey="shipping-delivery" />} />
      <Route path="/privacy-policy" element={<PolicyPage pageKey="privacy-policy" />} />
      <Route path="/terms-conditions" element={<PolicyPage pageKey="terms-conditions" />} />
      <Route path="/quality-purity" element={<Navigate to="/about-us" replace />} />
      <Route path="/blog" element={<Navigate to="/" replace />} />
      <Route path="/blog/:slug" element={<Navigate to="/" replace />} />
      <Route path="/careers" element={<Navigate to="/about-us" replace />} />
      <Route path="/returns-refunds" element={<Navigate to="/terms-conditions" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
