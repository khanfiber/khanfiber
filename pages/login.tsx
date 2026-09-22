import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, LogIn, ShieldCheck, Globe } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // ایڈمن یا کسٹمر لاگ ان چیک
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('pppoe_username', username)
        .single();

      if (error || !data) {
        setErrorMsg('یوزر نیم یا پاسورڈ غلط ہے!');
      } else {
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMsg('لاگ ان میں خرابی پیش آئی: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b132b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#1c2541',
        borderRadius: '24px',
        border: '1px solid #3b82f6',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        position: 'relative'
      }}>

        {/* 1. پبلک فولڈر سے لوگو (public/logo.png) */}
        <div style={{
          width: '85px',
          height: '85px',
          borderRadius: '20px',
          backgroundColor: '#0f172a',
          border: '2px solid #38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '6px',
          boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
        }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              // اگر لوگو کی امیج لوڈ نہ ہو تو فال بیک دکھائے
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* 2. ٹائٹل اور ذیلی متن */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            خان فائبر انٹرنیٹ نیٹ ورک
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Globe size={12} /> پورٹل مینجمنٹ سسٹم
          </p>
        </div>

        {/* ایرر پیغام */}
        {errorMsg && (
          <div style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* 3. لاگ ان فارم */}
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* یوزر نیم */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
              یوزر نیم (Username / Account)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                required
                placeholder="اپنا یوزر نیم درج کریں" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
              <User size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
            </div>
          </div>

          {/* پاسورڈ */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
              پاسورڈ (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
              <Lock size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
            </div>
          </div>

          {/* لاگ ان بٹن */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '11px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}
          >
            <LogIn size={16} />
            {loading ? 'لاگ ان ہو رہا ہے...' : 'اکاؤنٹ لاگ ان کریں'}
          </button>
        </form>

        {/* 4. اپ ڈیٹ شدہ فوٹر متن (Powered by Saqqa Software Service) */}
        <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px solid #1e293b', paddingTop: '10px', width: '100%' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={12} style={{ color: '#10b981' }} />
            محفوظ و خودکار ISP منیجمنٹ سسٹم
          </p>
          <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: '500', direction: 'ltr' }}>
            Powered by Wateen Telecom Service
          </p>
        </div>

      </div>
    </div>
  );
}