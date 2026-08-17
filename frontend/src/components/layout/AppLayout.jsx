import React, { useState } from 'react';
import TopUtilityBar from './TopUtilityBar';
import Header from './Header';
import Nav from './Nav';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import HamburgerDrawer from './HamburgerDrawer';
import WhatsAppFloat from './WhatsAppFloat';
import GiftAdvisor from '@/components/ai/GiftAdvisor';
import RouteSeo from '@/seo/RouteSeo';

export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <RouteSeo />
      <div className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(31,22,16,0.06)]">
        <TopUtilityBar />
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <Nav />
      </div>
      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 pb-10 md:pb-14">{children}</main>
      <Footer />
      <MobileBottomNav />
      <div
        className="fixed left-4 z-50 flex flex-col items-start gap-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6"
        data-testid="float-gift-advisor"
      >
        <GiftAdvisor />
      </div>
      <div
        className="fixed right-4 z-50 flex flex-col items-end gap-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6"
        data-testid="float-actions"
      >
        <WhatsAppFloat />
      </div>
    </div>
  );
}
