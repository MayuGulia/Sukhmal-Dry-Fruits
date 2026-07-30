import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { MapPin, Phone, MessageCircle, Mail, Send, ChevronDown } from 'lucide-react';
import { FAQS } from '@/data/mockContent';

export default function Contact() {
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', subject: '', qtype: 'General', orderId: '', msg: '', consent: false });
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);
  const submit = (e) => { e.preventDefault(); if (!form.consent) return alert('Please accept the privacy policy.'); setSent(true); };

  return (
    <div>
      <PageHeader title="Contact Us" subtitle="We’re here to help — pick a channel that suits you." breadcrumb={[{ label: 'Contact Us' }]} />
      <div className="sk-container py-10 grid md:grid-cols-4 gap-4">
        {[
          { Ic: MapPin, t: 'Visit Store', s: '145, Chandni Chowk, New Delhi' },
          { Ic: Phone, t: 'Call Us', s: '+91 98765 43210' },
          { Ic: MessageCircle, t: 'WhatsApp', s: 'Chat now, 9 AM – 9 PM' },
          { Ic: Mail, t: 'Email', s: 'support@sukhmal.in' },
        ].map(({ Ic, t, s }) => (
          <div key={t} className="sk-card p-5"><Ic size={26} className="text-brand-900" /><div className="font-display font-bold text-brand-900 mt-2">{t}</div><div className="text-[12px] text-ink-600 mt-0.5">{s}</div></div>
        ))}
      </div>

      <div className="sk-container pb-14 grid md:grid-cols-2 gap-8">
        <form onSubmit={submit} className="sk-card p-6 md:p-8 space-y-3">
          {sent ? (
            <div className="text-center py-8">
              <div className="font-display font-bold text-brand-900 text-2xl">Thank you!</div>
              <p className="text-ink-600 mt-2">We’ll get back within 24 hours.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3"><input required value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} placeholder="First name" className="sk-input" /><input required value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} placeholder="Last name" className="sk-input" /></div>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="sk-input" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="sk-input" />
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="sk-input" />
              <select value={form.qtype} onChange={(e) => setForm({ ...form, qtype: e.target.value })} className="sk-input">{['General','Order Inquiry','Bulk Order','Feedback','Partnership'].map((o) => <option key={o}>{o}</option>)}</select>
              <input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="Order ID (optional)" className="sk-input" />
              <textarea required rows={4} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Your message" className="sk-input" />
              <label className="flex items-center gap-2 text-[12px] text-ink-600"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /> I agree to Sukhmal’s privacy policy.</label>
              <button className="sk-btn-primary w-full"><Send size={16} /> Send Message</button>
            </>
          )}
        </form>

        <div>
          <div className="sk-card overflow-hidden mb-4">
            <iframe title="Sukhmal store" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d112000!2d77.2299!3d28.6562!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM5JzIyLjMiTiA3N8KwMTMnNDcuNiJF!5e0!3m2!1sen!2sin!4v1700000000" className="w-full h-[300px] border-0" allowFullScreen="" loading="lazy" />
          </div>
          <div className="sk-card p-5">
            <div className="font-display font-bold text-brand-900">Store Hours</div>
            <div className="text-sm text-ink-600 mt-2">Mon–Sat: 10:00 AM – 8:00 PM<br />Sunday: 11:00 AM – 6:00 PM</div>
            <div className="text-[12px] text-ink-500 mt-2">Parking: Free 2-wheeler & paid 4-wheeler nearby.</div>
            <a href="https://goo.gl/maps" target="_blank" rel="noreferrer" className="sk-btn-outline mt-4 text-sm !py-2"><MapPin size={14} /> Get Directions</a>
          </div>
        </div>
      </div>

      <div className="sk-container pb-14">
        <div className="font-display text-2xl text-brand-900 font-bold mb-4">Frequently Asked Questions</div>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="sk-card">
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-semibold text-brand-900">{f.q}</span>
                <ChevronDown size={16} className={`transition ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-4 text-sm text-ink-600">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
