import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { ORDER_STATUSES, canonicalStatus, showTrackingFields } from '@/lib/orderStatus';

const TODO_DTDC = 'Replace static estimate / manual tracking entry with DTDC API once API key is available — DTDC will provide real-time status + ETA.';

export function OrderStatusControls({ order, onError, compact = false }) {
  const [status, setStatus] = useState(canonicalStatus(order.status || order.orderStatus));
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [courierName, setCourierName] = useState(order.courierName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(canonicalStatus(order.status || order.orderStatus));
    setTrackingNumber(order.trackingNumber || '');
    setCourierName(order.courierName || '');
  }, [order.orderId, order.status, order.orderStatus, order.trackingNumber, order.courierName]);

  const persist = async (nextStatus, extra) => {
    setSaving(true);
    try {
      await adminApi.setStatus(order.orderId, nextStatus, extra);
    } catch (err) {
      onError?.(err);
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = (next) => {
    setStatus(next);
    if (showTrackingFields(next)) {
      if (!courierName) setCourierName('DTDC');
      return;
    }
    persist(next);
  };

  const saveShipped = () => persist(status, {
    trackingNumber,
    courierName: courierName || 'DTDC',
  });

  const showFields = showTrackingFields(status);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2 min-w-[180px]'}>
      {/* TODO: Replace static estimate / manual tracking entry with DTDC API once API key is available — DTDC will provide real-time status + ETA. */}
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onStatusChange(e.target.value)}
        className="sk-input !py-1.5 !text-[13px] w-full"
        aria-label="Order status"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {showFields && (
        <div className="space-y-1.5">
          <input
            className="sk-input !py-1.5 !text-[13px]"
            placeholder="Tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            aria-label="Tracking number"
          />
          <input
            className="sk-input !py-1.5 !text-[13px]"
            placeholder="Courier name (DTDC)"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            aria-label="Courier name"
          />
          <button
            type="button"
            className="sk-btn-primary !py-1.5 !px-3 !text-[12px] w-full"
            disabled={saving}
            onClick={saveShipped}
          >
            {saving ? 'Saving…' : 'Save tracking'}
          </button>
          <p className="text-[10px] text-ink-500 leading-snug">{TODO_DTDC}</p>
        </div>
      )}
    </div>
  );
}
