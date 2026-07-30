import React, { useState } from 'react';
import TopUtilityBar from './TopUtilityBar';
import Header from './Header';
import Nav from './Nav';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import HamburgerDrawer from './HamburgerDrawer';
import WhatsAppFloat from './WhatsAppFloat';

export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <TopUtilityBar />
      <Header onOpenDrawer={() => setDrawerOpen(true)} />
      <Nav />
      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppFloat />
    </div>
  );
}
