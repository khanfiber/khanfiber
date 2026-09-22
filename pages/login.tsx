import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, LogIn, ShieldCheck, Globe, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const inputVal = username.trim();

      // 1. ایڈمن لاگ ان (admin / admin123)
      if (inputVal === 'admin' && password === (localStorage.getItem('admin_password') || 'admin123')) {
        localStorage.setItem('user', JSON.stringify({ full_name: 'ایڈمن', role: 'admin', username: 'admin' }));
        router.push('/admin/dashboard');
        return;
      }

      // 2. Supabase سے تمام صارفین فیچ کریں
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*');

      if (error || !customersData) {
        setErrorMsg('ڈیٹا بیس سے رابطہ نہیں ہو سکا!');
        return;
      }

      // serial_number, email یا pppoe_username سے کسٹمر کی تلاش
      const foundCustomer = customersData.find((c: any) => 
        (c.serial_number && c.serial_number.trim().toLowerCase() === inputVal.toLowerCase()) ||
        (c.email && c.email.trim().toLowerCase() === inputVal.toLowerCase()) ||
        (c.pppoe_username && c.pppoe_username.trim().toLowerCase() === inputVal.toLowerCase())
      );

      if (!foundCustomer) {
        setErrorMsg('یوزر نیم، ای میل یا KFN کسٹمر نمبر موجود نہیں ہے!');
      } else {
        // پاسورڈ کی تصدیق (اگر کالم میں نہ ہو تو ڈیفالٹ 12345)
        const validPass = foundCustomer.password || '12345';
        
        if (password === validPass) {
          localStorage.setItem('user', JSON.stringify({ ...foundCustomer, role: 'customer' }));
          router.push('/user/dashboard');
        } else {
          setErrorMsg('پاسورڈ غلط ہے!');
        }
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
        boxSizing: 'border-box'
      }}>

        {/* لوگو */}
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
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        </div>

        {/* ٹائٹل */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            خان فائبر انٹرنیٹ نیٹ ورک
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Globe size={12} /> پورٹل مینجمنٹ سسٹم
          </p>
        </div>

        {/* غلطی کا پیغام */}
        {errorMsg && (
          <div style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }}>
            {errorMsg}
          </div>
        )}

        {/* فارم */}
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* یوزر نیم فیلڈ */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
              یوزر نیم / ای میل / کسٹمر نمبر (مثلاً: KFN-0001)
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                required
                placeholder="KFN-0001 یا ای میل درج کریں" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '10px 40px 10px 12px', // بائیں اور دائیں پڈنگ فکسڈ
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <User size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* پاسورڈ فیلڈ شو/ہائیڈ اپشن کے ساتھ */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
              پاسورڈ (Password)
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              {/* بائیں طرف شو/ہائیڈ بٹن */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  zIndex: 2,
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '10px 36px 10px 36px', // دونوں اطراف جگہ برابر تاکہ ائکنز اوپر نہ آئیں
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  direction: 'ltr'
                }}
              />

              {/* دائیں طرف پاسورڈ آئکن */}
              <Lock size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
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

        {/* فوٹر */}
        <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px solid #1e293b', paddingTop: '10px', width: '100%' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={12} style={{ color: '#10b981' }} /> محفوظ و خودکار ISP منیجمنٹ سسٹم
          </p>
          <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: '500', direction: 'ltr' }}>
            Powered by Saqaa Software Services
          </p>
        </div>

      </div>
    </div>
  );
}