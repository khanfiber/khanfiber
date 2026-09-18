import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { 
  Wifi, 
  Lock, 
  User, 
  LogIn, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('براہِ کرم یوزر نیم اور پاسورڈ درج کریں!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. ایڈمن لاگ ان چیک کریں (Hardcoded or Admin Table)
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('user_role', 'admin');
        router.push('/admin/dashboard');
        return;
      }

      // 2. کسٹمر لاگ ان (Supabase customers Table چیک کریں)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('pppoe_username', username)
        .eq('pppoe_password', password)
        .single();

      if (data) {
        localStorage.setItem('user_role', 'customer');
        localStorage.setItem('customer_data', JSON.stringify(data));
        router.push('/customer/portal');
      } else {
        setErrorMessage('غلط یوزر نیم یا پاسورڈ! دوبارہ کوشش کریں۔');
      }
    } catch (err: any) {
      setErrorMessage('لاگ ان میں خرابی: یوزر نیم یا پاسورڈ درست نہیں ہے۔');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0b0f19 75%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* اصلی لاگ ان کارڈ */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#1c2541',
        borderRadius: '24px',
        border: '1px solid #334155',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
        padding: '36px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* شائننگ ٹاپ ڈیزائن بار */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ec4899, #3b82f6, #06b6d4)'
        }}></div>

        {/* برانڈ لوگو اور ہیڈر */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #3b82f6',
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            marginBottom: '14px',
            position: 'relative'
          }}>
            <Wifi size={36} style={{ color: '#38bdf8' }} />
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              backgroundColor: '#ec4899',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '6px'
            }}>KFN</div>
          </div>

          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
            خان فائبر انٹرنیٹ نیٹ ورک
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={13} style={{ color: '#38bdf8' }} />
            سماء سوفٹویئر مینجمنٹ پورٹل
          </p>
        </div>

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* لاگ ان فارم */}
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* یوزر نیم */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px', textAlign: 'right' }}>
              یوزر نیم (Username / Account)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="اپنا یوزر نیم درج کریں"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
              <User size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
            </div>
          </div>

          {/* پاسورڈ */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px', textAlign: 'right' }}>
              پاسورڈ (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
            </div>
          </div>

          {/* سبمٹ لاگ ان بٹن */}
          <button 
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              width: '100%',
              backgroundColor: '#3b82f6',
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              transition: 'transform 0.1s, opacity 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                تصدیق ہو رہی ہے...
              </>
            ) : (
              <>
                <LogIn size={18} />
                اکاؤنٹ لاگ ان کریں
              </>
            )}
          </button>

        </form>

        {/* فوٹر انفارمیشن */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #1e293b', width: '100%', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            محفوظ و خودکار ISP منیجمنٹ سسٹم
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#475569' }}>
            Powered by Saqaa Software Services
          </p>
        </div>

      </div>

    </div>
  );
}