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
import { StoreLocator, PolicyPage, Blog, BlogArticle, Careers, FAQs, NotFound } from '@/pages/ContentPages';
import { AccountLayout, Dashboard as AccountDashboard, MyOrders, OrderDetail, ReturnOrder, Addresses, PaymentMethods, Loyalty, ProfileSettings } from '@/pages/account/Account';
import { AdminLayout, AdminDashboard, AdminProducts, AdminOrders, AdminInventory, AdminCustomers, AdminOffers } from '@/pages/admin/Admin';

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
                {/* ADMIN — own layout, silent guard */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="offers" element={<AdminOffers />} />
                </Route>

                {/* CUSTOMER — with global layout */}
                <Route path="*" element={<Shell><CustomerRoutes /></Shell>} />
              </Routes>
            </BrowserRouter>
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
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success/:orderId" element={<OrderSuccess />} />
      <Route path="/order-failed/:orderId" element={<OrderFailed />} />
      <Route path="/track-order" element={<TrackOrder />} />

      {/* Wishlist */}
      <Route path="/wishlist" element={<Wishlist />} />

      {/* Auth */}
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/verify-otp" element={<AuthPage mode="otp" />} />

      {/* Account */}
      <Route path="/account" element={<AccountLayout />}>
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
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogArticle />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/shipping-delivery" element={<PolicyPage pageKey="shipping-delivery" />} />
      <Route path="/returns-refunds" element={<PolicyPage pageKey="returns-refunds" />} />
      <Route path="/privacy-policy" element={<PolicyPage pageKey="privacy-policy" />} />
      <Route path="/terms-conditions" element={<PolicyPage pageKey="terms-conditions" />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
