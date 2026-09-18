import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('PWA Service Worker Registered:', reg.scope),
          (err) => console.log('Service Worker Registration Failed:', err)
        );
      });
    }
  }, []);

  return <Component {...pageProps} />;
}