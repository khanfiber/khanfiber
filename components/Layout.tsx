import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { 
  LogOut, 
  KeyRound, 
  CheckCircle2, 
  X, 
  User, 
  ChevronDown, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function Layout({ children, showNavButtons = true }: { children: React.ReactNode; showNavButtons?: boolean }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // باہر کلک کرنے پر ڈراپ ڈاؤن مینو بند کریں
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    if (user?.role === 'admin') {
      localStorage.setItem('admin_password', newPassword);
      setMsg('ایڈمن پاسورڈ کامیابی سے تبدیل ہو گیا!');
    } else if (user?.id) {
      const { error } = await supabase
        .from('customers')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) {
        setMsg('خرابی: ' + error.message);
      } else {
        setMsg('پاسورڈ کامیابی سے اپ ڈیٹ ہو گیا!');
      }
    }

    setTimeout(() => {
      setMsg('');
      setShowPasswordModal(false);
      setShowMenu(false);
      setNewPassword('');
    }, 2000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: '#fff', 
      direction: 'rtl', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      
      {/* 1. ہیڈر بار */}
      <header style={{ 
        backgroundColor: '#1c2541', 
        padding: '10px 16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #334155',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        
        {/* بائیں طرف لوگو اور برانڈ نیم */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            backgroundColor: '#0f172a', 
            border: '1.5px solid #38bdf8', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            padding: '2px'
          }}>
            <img 
              src="/logo.png" 
              alt="Khan Fiber Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '900', 
              color: '#38bdf8', 
              letterSpacing: '0.5px',
              textShadow: '0 2px 8px rgba(56, 189, 248, 0.3)'
            }}>
              خان فائبر انٹرنیٹ نیٹ ورک
            </h1>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>
              خودکار ISP مینجمنٹ پورٹل
            </p>
          </div>
        </div>

        {/* دائیں طرف ڈیش بورڈ بٹن اور یوزر پروائل (ہیڈن ڈراپ ڈاؤن) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* ڈیش بورڈ پر واپس جائیں (اگر ایڈمن پیج ہو) */}
          {showNavButtons && router.pathname !== '/admin/dashboard' && (
            <Link href="/admin/dashboard" style={{ 
              backgroundColor: '#0f172a', 
              color: '#38bdf8', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontSize: '11px', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              border: '1px solid #334155'
            }}>
              <ArrowRight size={14} />
              ڈیش بورڈ
            </Link>
          )}

          {/* پروفائل ڈراپ ڈاؤن مینو */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              style={{ 
                backgroundColor: '#0f172a', 
                color: '#ffffff', 
                border: '1px solid #3b82f6', 
                padding: '6px 10px', 
                borderRadius: '8px', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}
            >
              <User size={14} style={{ color: '#38bdf8' }} />
              <span>{user?.full_name || 'اکاؤنٹ'}</span>
              <ChevronDown size={12} style={{ color: '#94a3b8' }} />
            </button>

            {/* ہیڈن ڈراپ ڈاؤن لسٹ */}
            {showMenu && (
              <div style={{ 
                position: 'absolute', 
                top: '110%', 
                left: 0, 
                backgroundColor: '#1c2541', 
                border: '1px solid #3b82f6', 
                borderRadius: '10px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
                minWidth: '160px', 
                zIndex: 100, 
                overflow: 'hidden' 
              }}>
                {/* 1. پاسورڈ تبدیل کریں */}
                <button 
                  onClick={() => {
                    setShowPasswordModal(true);
                    setShowMenu(false);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    backgroundColor: 'transparent', 
                    color: '#fbbf24', 
                    border: 'none', 
                    borderBottom: '1px solid #334155', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    textAlign: 'right'
                  }}
                >
                  <KeyRound size={14} />
                  پاسورڈ تبدیل کریں
                </button>

                {/* 2. لاگ آؤٹ */}
                <button 
                  onClick={handleLogout}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    backgroundColor: 'transparent', 
                    color: '#f87171', 
                    border: 'none', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    textAlign: 'right'
                  }}
                >
                  <LogOut size={14} />
                  لاگ آؤٹ کریں
                </button>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* 2. مرکزی مواد (Page Content) */}
      <main style={{ padding: '16px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* 3. فوٹر بار (Copyright & Powered By) */}
      <footer style={{ 
        backgroundColor: '#1c2541', 
        borderTop: '1px solid #334155', 
        padding: '12px 16px', 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '4px',
        marginTop: '20px'
      }}>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} style={{ color: '#10b981' }} />
          © {new Date().getFullYear()} خان فائبر انٹرنیٹ نیٹ ورک۔ تمام حقوق محفوظ ہیں۔
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', direction: 'ltr' }}>
          Powered by Saqaa Software Services
        </p>
      </footer>

      {/* 4. پاسورڈ تبدیل کرنے کا پاپ اپ (Modal) */}
      {showPasswordModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 100, 
          padding: '16px' 
        }}>
          <div style={{ 
            backgroundColor: '#1c2541', 
            border: '1px solid #3b82f6', 
            borderRadius: '14px', 
            padding: '20px', 
            width: '100%', 
            maxWidth: '340px', 
            position: 'relative',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
          }}>
            
            <button 
              onClick={() => setShowPasswordModal(false)} 
              style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} /> نیا پاسورڈ درج کریں
            </h3>

            {msg && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '8px', borderRadius: '6px', fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> {msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="password"
                required
                placeholder="نیا پاسورڈ ٹائپ کریں"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
              />

              <button type="submit" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                پاسورڈ محفوظ کریں
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}