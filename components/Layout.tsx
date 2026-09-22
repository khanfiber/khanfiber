import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { LogOut, KeyRound, CheckCircle2, X } from 'lucide-react';

export default function Layout({ children, showNavButtons = true }: { children: React.ReactNode; showNavButtons?: boolean }) {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (currentUser.role === 'admin') {
      localStorage.setItem('admin_password', newPassword);
      setMsg('ایڈمن پاسورڈ کامیابی سے تبدیل ہو گیا!');
    } else if (currentUser.id) {
      const { error } = await supabase
        .from('customers')
        .update({ password: newPassword })
        .eq('id', currentUser.id);

      if (error) {
        setMsg('خرابی: ' + error.message);
      } else {
        setMsg('پاسورڈ کامیابی سے اپ ڈیٹ ہو گیا!');
      }
    }

    setTimeout(() => {
      setMsg('');
      setShowPasswordModal(false);
      setNewPassword('');
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', direction: 'rtl', fontFamily: 'sans-serif' }}>
      
      {/* ہیڈر */}
      <header style={{ backgroundColor: '#1c2541', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <h1 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>خان فائبر پورٹل</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* پاسورڈ تبدیل کرنے کا بٹن */}
          <button 
            onClick={() => setShowPasswordModal(true)}
            style={{ backgroundColor: '#334155', color: '#fbbf24', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
          >
            <KeyRound size={14} /> پاسورڈ تبدیل کریں
          </button>

          {/* لاگ آؤٹ بٹن */}
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
          >
            <LogOut size={14} /> لاگ آؤٹ
          </button>
        </div>
      </header>

      {/* مرکزی مواد */}
      <main style={{ padding: '16px' }}>
        {children}
      </main>

      {/* پاسورڈ تبدیل کرنے کا پاپ اپ (Modal) */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '340px', position: 'relative' }}>
            
            <button onClick={() => setShowPasswordModal(false)} style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} /> نیا پاسورڈ منتخب کریں
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
                placeholder="نیا پاسورڈ درج کریں"
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