import React, { useState } from 'react';
import TopUtilityBar from './TopUtilityBar';
import Header from './Header';
import Nav from './Nav';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import HamburgerDrawer from './HamburgerDrawer';
import WhatsAppFloat from './WhatsAppFloat';
import GiftAdvisor from '@/components/ai/GiftAdvisor';

export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(31,22,16,0.06)]">
        <TopUtilityBar />
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <Nav />
      </div>
      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <GiftAdvisor />
      <WhatsAppFloat />
    </div>
  );
}
