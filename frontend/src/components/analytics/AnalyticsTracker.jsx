import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/analyticsEvents';

export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return undefined;
    trackEvent('page_view', { metadata: { path: pathname } });
    return undefined;
  }, [pathname]);

  return null;
}
