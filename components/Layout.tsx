import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { 
  LogOut, KeyRound, CheckCircle2, X, User, ChevronDown, ArrowRight 
} from 'lucide-react';

export default function Layout({ children, showNavButtons = true }: any) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

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

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    if (!newPassword) return;

    if (user?.role === 'admin') {
      localStorage.setItem('admin_password', newPassword);
      setMsg('ایڈمن پاسورڈ تبدیل ہو گیا!');
    } else {
      const { error } = await supabase
        .from('customers')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) setMsg(error.message);
      else setMsg('پاسورڈ اپڈیٹ ہو گیا!');
    }

    setTimeout(() => {
      setMsg('');
      setShowPasswordModal(false);
      setNewPassword('');
    }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#020617,#0f172a,#020617)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* HEADER */}
      <header style={{
        backdropFilter: 'blur(12px)',
        background: 'rgba(15,23,42,0.7)',
        borderBottom: '1px solid rgba(56,189,248,0.2)',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>

        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: 45 }} />
          <div>
            <h2 style={{ margin: 0, color: '#38bdf8' }}>One Click</h2>
            <small style={{ color: '#94a3b8' }}>by Layyah Fiber</small>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {showNavButtons && (
            <Link href="/admin/dashboard" style={{
              background: '#020617',
              border: '1px solid #38bdf8',
              padding: '6px 10px',
              borderRadius: 8,
              color: '#38bdf8'
            }}>
              <ArrowRight size={14}/> ڈیش بورڈ
            </Link>
          )}

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{
              background: '#020617',
              border: '1px solid #38bdf8',
              padding: '6px 10px',
              borderRadius: 8
            }}>
              <User size={14}/> {user?.full_name || 'اکاؤنٹ'}
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                background: '#020617',
                border: '1px solid #38bdf8',
                borderRadius: 10
              }}>
                <button onClick={() => setShowPasswordModal(true)}>پاسورڈ تبدیل کریں</button>
                <button onClick={handleLogout}>لاگ آؤٹ</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, padding: 16 }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{
        background: 'rgba(15,23,42,0.8)',
        borderTop: '1px solid rgba(56,189,248,0.2)',
        padding: 16,
        textAlign: 'center'
      }}>
        
        {/* COMPANY */}
        <div style={{ marginBottom: 6 }}>
          <strong style={{ color: '#38bdf8' }}>
            Haider Fiber Network SMC-Private Limited
          </strong>
        </div>

        {/* WATEEN LOGO */}
        <div style={{ marginBottom: 6 }}>
          <img src="/wateen.png" style={{ width: 80 }} />
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8' }}>
          © {new Date().getFullYear()} One Click — All Rights Reserved
        </p>

      </footer>

      {/* MODAL */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: '#020617',
            padding: 20,
            borderRadius: 12
          }}>
            <h3>نیا پاسورڈ</h3>
            {msg && <p>{msg}</p>}
            <form onSubmit={handleChangePassword}>
              <input type="password" value={newPassword}
                onChange={(e)=>setNewPassword(e.target.value)} />
              <button type="submit">محفوظ کریں</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}