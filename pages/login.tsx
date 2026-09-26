import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import {
  User,
  Lock,
  LogIn,
  ShieldCheck,
  Globe2,
  Eye,
  EyeOff,
  Wifi,
  Loader2,
  AlertCircle,
  Headphones,
  Network
} from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const inputVal = username.trim();
      const passwordVal = password.trim();

      /* =========================
         BASIC VALIDATION
      ========================= */

      if (!inputVal) {
        setErrorMsg('یوزر نیم درج کریں۔');
        return;
      }

      if (!passwordVal) {
        setErrorMsg('پاسورڈ درج کریں۔');
        return;
      }

      /* =====================================================
         1. ADMIN LOGIN
      ===================================================== */

      if (inputVal.toLowerCase() === 'admin') {
        const adminPassword =
          localStorage.getItem('admin_password') ||
          'admin123';

        if (passwordVal === adminPassword) {
          localStorage.setItem(
            'user',
            JSON.stringify({
              full_name: 'Administrator',
              role: 'admin',
              username: 'admin'
            })
          );

          await router.push('/admin/dashboard');
          return;
        }

        setErrorMsg('یوزر نیم یا پاسورڈ غلط ہے۔');
        return;
      }

      /* =====================================================
         2. CUSTOMER LOGIN

         Customer can internally login using:
         - Serial Number
         - Email
         - PPPoE Username

         UI only shows "Username"
      ===================================================== */

      const normalizedInput = inputVal.toLowerCase();

      const { data: customersData, error } =
        await supabase
          .from('customers')
          .select('*')
          .or(
            `serial_number.ilike.${normalizedInput},email.ilike.${normalizedInput},pppoe_username.ilike.${normalizedInput}`
          )
          .limit(1);

      if (error) {
        console.error('Login Database Error:', error);

        setErrorMsg(
          'ڈیٹا بیس سے رابطہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔'
        );

        return;
      }

      const foundCustomer =
        customersData && customersData.length > 0
          ? customersData[0]
          : null;

      if (!foundCustomer) {
        setErrorMsg('یوزر نیم یا پاسورڈ غلط ہے۔');
        return;
      }

      /* =====================================================
         3. PASSWORD CHECK
      ===================================================== */

      const validPassword =
        foundCustomer.password || '12345';

      if (passwordVal !== validPassword) {
        setErrorMsg('یوزر نیم یا پاسورڈ غلط ہے۔');
        return;
      }

      /* =====================================================
         4. SAVE CUSTOMER SESSION
      ===================================================== */

      localStorage.setItem(
        'user',
        JSON.stringify({
          ...foundCustomer,
          role: 'customer'
        })
      );

      await router.push('/user/dashboard');

    } catch (err: any) {
      console.error('Login Error:', err);

      setErrorMsg(
        'لاگ اِن میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     COMMON STYLES
  ========================================================= */

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '50px',
    background:
      'linear-gradient(135deg, #071525 0%, #091b2d 100%)',
    border: '1px solid #1e4663',
    color: '#ffffff',
    padding: '0 44px',
    borderRadius: '13px',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all .2s ease'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: '7px'
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 15% 10%, rgba(6,182,212,.15), transparent 28%), radial-gradient(circle at 90% 90%, rgba(37,99,235,.14), transparent 30%), linear-gradient(135deg, #020817 0%, #061323 45%, #071a2c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, Arial, sans-serif',
        direction: 'rtl',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* =====================================================
          BACKGROUND GLOW - TOP
      ===================================================== */}

      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'rgba(6,182,212,.05)',
          filter: 'blur(75px)',
          top: '-150px',
          right: '-120px',
          pointerEvents: 'none'
        }}
      />

      {/* =====================================================
          BACKGROUND GLOW - BOTTOM
      ===================================================== */}

      <div
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(37,99,235,.06)',
          filter: 'blur(75px)',
          bottom: '-140px',
          left: '-120px',
          pointerEvents: 'none'
        }}
      />

      {/* =====================================================
          LOGIN CARD
      ===================================================== */}

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background:
            'linear-gradient(145deg, rgba(8,24,40,.98) 0%, rgba(8,30,49,.98) 100%)',
          borderRadius: '26px',
          border: '1px solid rgba(34,211,238,.20)',
          boxShadow:
            '0 30px 80px rgba(0,0,0,.48), 0 0 0 1px rgba(255,255,255,.02)',
          padding: '30px 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        {/* ===================================================
            TOP PREMIUM LINE
        =================================================== */}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '12%',
            right: '12%',
            height: '2px',
            background:
              'linear-gradient(90deg, transparent, #22d3ee, #3b82f6, transparent)'
          }}
        />

        {/* ===================================================
            LOGO
        =================================================== */}

        <div
          style={{
            width: '94px',
            height: '94px',
            borderRadius: '23px',
            background:
              'linear-gradient(145deg, #071525, #0b2035)',
            border: '1px solid rgba(34,211,238,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '7px',
            boxSizing: 'border-box',
            boxShadow:
              '0 12px 35px rgba(6,182,212,.18)',
            marginBottom: '17px'
          }}
        >
          <img
            src="/logo.png"
            alt="One Click"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              (e.target as HTMLElement).style.display =
                'none';
            }}
          />
        </div>

        {/* ===================================================
            BRAND NAME
        =================================================== */}

        <div
          style={{
            textAlign: 'center',
            width: '100%'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '5px'
            }}
          >
            <Wifi
              size={19}
              style={{
                color: '#22d3ee'
              }}
            />

            <h1
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '26px',
                fontWeight: '900',
                letterSpacing: '.5px',
                direction: 'ltr'
              }}
            >
              One Click
            </h1>
          </div>

          <div
            style={{
              color: '#67e8f9',
              fontSize: '12px',
              fontWeight: '800',
              direction: 'ltr',
              letterSpacing: '.3px'
            }}
          >
            HAIDER FIBER NETWORK
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '9px',
              marginTop: '4px',
              direction: 'ltr',
              letterSpacing: '.4px'
            }}
          >
            (SMC-PRIVATE) LIMITED
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              color: '#94a3b8',
              fontSize: '10px',
              marginTop: '11px',
              direction: 'ltr'
            }}
          >
            <Globe2
              size={12}
              style={{
                color: '#38bdf8'
              }}
            />

            ISP Customer Management Portal
          </div>
        </div>

        {/* ===================================================
            DIVIDER
        =================================================== */}

        <div
          style={{
            width: '100%',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, #164e63, transparent)',
            margin: '21px 0'
          }}
        />

        {/* ===================================================
            LOGIN HEADING
        =================================================== */}

        <div
          style={{
            width: '100%',
            marginBottom: '17px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(6,182,212,.10)',
                border:
                  '1px solid rgba(34,211,238,.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={19} />
            </div>

            <div>
              <div
                style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: '800'
                }}
              >
                اکاؤنٹ لاگ اِن
              </div>

              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px',
                  marginTop: '3px'
                }}
              >
                اپنے اکاؤنٹ کی معلومات درج کریں
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            ERROR MESSAGE
        =================================================== */}

        {errorMsg && (
          <div
            style={{
              width: '100%',
              background: 'rgba(244,63,94,.08)',
              border:
                '1px solid rgba(244,63,94,.35)',
              color: '#fb7185',
              padding: '11px 12px',
              borderRadius: '11px',
              fontSize: '11px',
              textAlign: 'right',
              boxSizing: 'border-box',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <AlertCircle
              size={16}
              style={{
                flexShrink: 0
              }}
            />

            <span>{errorMsg}</span>
          </div>
        )}

        {/* ===================================================
            LOGIN FORM
        =================================================== */}

        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* =================================================
              USERNAME
          ================================================= */}

          <div>
            <label style={labelStyle}>
              یوزر نیم (Username)
            </label>

            <div
              style={{
                position: 'relative',
                width: '100%'
              }}
            >
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg('');
                }}
                style={{
                  ...inputStyle,
                  direction: 'ltr',
                  textAlign: 'left',
                  paddingRight: '44px',
                  paddingLeft: '14px'
                }}
              />

              <User
                size={17}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '16px',
                  color: '#22d3ee',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div>
            <label style={labelStyle}>
              پاسورڈ (Password)
            </label>

            <div
              style={{
                position: 'relative',
                width: '100%'
              }}
            >
              <input
                type={
                  showPassword ? 'text' : 'password'
                }
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                style={{
                  ...inputStyle,
                  direction: 'ltr',
                  textAlign: 'left',
                  paddingRight: '44px',
                  paddingLeft: '44px'
                }}
              />

              {/* PASSWORD ICON */}

              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '16px',
                  color: '#22d3ee',
                  pointerEvents: 'none'
                }}
              />

              {/* SHOW / HIDE PASSWORD */}

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '14px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '49px',
              background: loading
                ? '#155e75'
                : 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '13px',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              boxShadow:
                '0 10px 25px rgba(8,145,178,.20)',
              transition: 'all .2s ease'
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                لاگ اِن ہو رہا ہے...
              </>
            ) : (
              <>
                <LogIn size={17} />

                اکاؤنٹ لاگ اِن کریں
              </>
            )}
          </button>
        </form>

        {/* ===================================================
            PORTAL INFO
        =================================================== */}

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '19px'
          }}
        >
          <div
            style={{
              background: 'rgba(15,23,42,.45)',
              border:
                '1px solid rgba(51,65,85,.60)',
              borderRadius: '10px',
              padding: '9px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              color: '#94a3b8',
              fontSize: '9px',
              direction: 'ltr'
            }}
          >
            <ShieldCheck
              size={13}
              style={{
                color: '#34d399'
              }}
            />

            Secure Portal
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,.45)',
              border:
                '1px solid rgba(51,65,85,.60)',
              borderRadius: '10px',
              padding: '9px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              color: '#94a3b8',
              fontSize: '9px',
              direction: 'ltr'
            }}
          >
            <Network
              size={13}
              style={{
                color: '#38bdf8'
              }}
            />

            ISP Management
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div
          style={{
            textAlign: 'center',
            marginTop: '19px',
            borderTop:
              '1px solid rgba(51,65,85,.55)',
            paddingTop: '14px',
            width: '100%'
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              direction: 'ltr'
            }}
          >
            <Headphones
              size={12}
              style={{
                color: '#22d3ee'
              }}
            />

            One Click Customer Service Portal
          </p>

          <p
            style={{
              margin: '6px 0 0',
              fontSize: '9px',
              color: '#475569',
              direction: 'ltr'
            }}
          >
            © One Click • Haider Fiber Network
            (SMC-Private) Limited
          </p>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: '9px',
              color: '#64748b',
              fontWeight: '500',
              direction: 'ltr'
            }}
          >
            Powered by Saqaa Software Services
          </p>
        </div>
      </div>
    </div>
  );
}