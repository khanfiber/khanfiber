import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Wifi, Home, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNavButtons?: boolean;
}

export default function Layout({ children, showNavButtons = true }: LayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('customer_data');
    router.push('/login');
  };

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      minHeight: '100vh',
      width: '100%',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* ہیڈر */}
      <header style={{
        backgroundColor: '#1c2541',
        borderBottom: '1px solid #334155',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          
          {/* نیویگیشن بٹنز */}
          {showNavButtons && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={13} />
                <span>لاگ آؤٹ</span>
              </button>

              <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Home size={13} />
                  <span>ہوم</span>
                </button>
              </Link>
            </div>
          )}

          {/* عنوان */}
          <div style={{ textTransform: 'capitalize', textAlign: 'right', overflow: 'hidden' }}>
            <h1 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#f472b6',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              خان فائبر انٹرنیٹ نیٹ ورک
            </h1>
            <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd', whiteSpace: 'nowrap' }}>
              انٹرنیٹ سروسز مینجمنٹ پورٹل
            </p>
          </div>

          {/* لوگو */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #3b82f6',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Wifi size={18} style={{ color: '#38bdf8' }} />
          </div>

        </div>
      </header>

      {/* باڈی کنٹینٹ (سکرولنگ سپورٹ کے ساتھ) */}
      <main style={{ padding: '12px 10px', maxWidth: '1400px', width: '100%', margin: '0 auto', flex: 1, boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* فٹر */}
      <footer style={{
        backgroundColor: '#1c2541',
        borderTop: '1px solid #334155',
        padding: '12px',
        textAlign: 'center',
        marginTop: 'auto',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <p style={{ margin: 0 }}>© 2026 خان فائبر انٹرنیٹ نیٹ ورک - جملہ حقوق محفوظ ہیں۔</p>
        <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: '#64748b' }}>Powered by Saqaa Software Services</p>
      </footer>
    </div>
  );
}