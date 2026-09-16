let loading;

export function loadRazorpay() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay needs a browser'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error('Razorpay failed to load'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Razorpay failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
