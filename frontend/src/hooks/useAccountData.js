import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeUserDoc, subscribeUserOrders } from '@/lib/orders';

export function useUserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return subscribeUserOrders(
      user.uid,
      (rows) => {
        setOrders(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user?.uid]);

  return { orders, loading };
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }
    return subscribeUserDoc(user.uid, (doc) => {
      setProfile(doc);
      setLoading(false);
    }, () => setLoading(false));
  }, [user?.uid]);

  return {
    user,
    profile,
    loading,
    name: profile?.name || user?.displayName || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || user?.phone || '',
    addresses: Array.isArray(profile?.addresses) ? profile.addresses : [],
  };
}
