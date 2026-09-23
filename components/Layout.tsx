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
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Layout({
  children,
  showNavButtons = true
}: {
  children: React.ReactNode;
  showNavButtons?: boolean;
}) {
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
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('User parse error:', error);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('user');
    router.push('/');
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) return;

    if (user?.role === 'admin') {
      localStorage.setItem('admin_password', newPassword);

      setMsg('ایڈمن پاسورڈ کامیابی سے تبدیل ہو گیا!');
    } else if (user?.id) {
      const { error } = await supabase
        .from('customers')
        .update({
          password: newPassword
        })
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
    <>
      <div className="app-shell">

        {/* =====================================================
            PREMIUM HEADER
        ===================================================== */}

        <header className="premium-header">

          <div className="header-glow header-glow-one" />
          <div className="header-glow header-glow-two" />

          <div className="header-inner">

            {/* =================================================
                RIGHT SIDE
                ONE CLICK LOGO + NAME
            ================================================= */}

            <div className="brand-area">

              <div className="brand-logo-wrap">
                <img
                  src="/logo.png"
                  alt="One Click Logo"
                  className="brand-logo"
                />

                <span className="online-dot" />
              </div>

              <div className="brand-text">

                <div className="brand-name">
                  <span className="brand-one">One</span>
                  <span className="brand-click"> Click</span>
                </div>

                <div className="brand-subtitle">
                  اسمارٹ ISP مینجمنٹ پورٹل
                </div>

              </div>

            </div>


            {/* =================================================
                CENTER
                HAIDER FIBER NETWORK BANNER
            ================================================= */}

            <div className="haider-banner-area">

              <div className="haider-banner-glow" />

              <div className="haider-banner-frame">

                <img
                  src="/haider-fiber.png"
                  alt="Haider Fiber Network"
                  className="haider-banner-image"
                />

              </div>

            </div>


            {/* =================================================
                LEFT SIDE
                DASHBOARD + ACCOUNT
            ================================================= */}

            <div className="header-actions">

              {showNavButtons &&
                router.pathname !== '/admin/dashboard' && (
                  <Link
                    href="/admin/dashboard"
                    className="dashboard-button"
                  >
                    <ArrowRight size={15} />
                    <span>ڈیش بورڈ</span>
                  </Link>
                )}


              <div
                className="profile-container"
                ref={menuRef}
              >

                <button
                  type="button"
                  className="profile-button"
                  onClick={() => setShowMenu(!showMenu)}
                >

                  <ChevronDown
                    size={16}
                    className={
                      showMenu
                        ? 'chevron chevron-open'
                        : 'chevron'
                    }
                  />

                  <div className="profile-icon">
                    <User size={19} />
                  </div>

                  <div className="profile-name">
                    {user?.full_name ||
                      (user?.role === 'admin'
                        ? 'ایڈمن'
                        : 'اکاؤنٹ')}
                  </div>

                </button>


                {/* =============================================
                    DROPDOWN
                ============================================= */}

                {showMenu && (
                  <div className="profile-menu">

                    <div className="menu-top">

                      <div className="menu-avatar">
                        <User size={19} />
                      </div>

                      <div>
                        <div className="menu-user-name">
                          {user?.full_name ||
                            (user?.role === 'admin'
                              ? 'Administrator'
                              : 'User')}
                        </div>

                        <div className="menu-user-role">
                          {user?.role === 'admin'
                            ? 'System Administrator'
                            : 'One Click Customer'}
                        </div>
                      </div>

                    </div>


                    <button
                      type="button"
                      className="menu-item password-item"
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <KeyRound size={16} />

                      <span>
                        پاسورڈ تبدیل کریں
                      </span>
                    </button>


                    <button
                      type="button"
                      className="menu-item logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />

                      <span>
                        لاگ آؤٹ کریں
                      </span>
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>

        </header>


        {/* =====================================================
            PAGE CONTENT
        ===================================================== */}

        <main className="page-content">
          {children}
        </main>


        {/* =====================================================
            PREMIUM FOOTER
        ===================================================== */}

        <footer className="premium-footer">

          <div className="footer-line" />

          <div className="footer-content">

            <div className="footer-copyright">

              <ShieldCheck
                size={16}
                className="footer-shield"
              />

              <span>
                © {new Date().getFullYear()} One Click •
                Haider Fiber Network
              </span>

              <span className="footer-separator">
                •
              </span>

              <span>
                تمام حقوق محفوظ ہیں
              </span>

            </div>


            <div className="powered-wrapper">

              <Sparkles
                size={13}
                className="powered-icon"
              />

              <span className="powered-small">
                Powered by
              </span>

              <span className="powered-name">
                Saqaa Software Services
              </span>

            </div>

          </div>

        </footer>


        {/* =====================================================
            CHANGE PASSWORD MODAL
        ===================================================== */}

        {showPasswordModal && (

          <div className="modal-overlay">

            <div className="password-modal">

              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowPasswordModal(false);
                  setMsg('');
                  setNewPassword('');
                }}
              >
                <X size={19} />
              </button>


              <div className="modal-icon">
                <KeyRound size={22} />
              </div>


              <h3 className="modal-title">
                نیا پاسورڈ
              </h3>

              <p className="modal-description">
                اپنے اکاؤنٹ کے لیے نیا پاسورڈ درج کریں
              </p>


              {msg && (
                <div className="success-message">

                  <CheckCircle2 size={16} />

                  <span>{msg}</span>

                </div>
              )}


              <form
                onSubmit={handleChangePassword}
                className="password-form"
              >

                <input
                  type="password"
                  required
                  placeholder="نیا پاسورڈ ٹائپ کریں"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="password-input"
                />

                <button
                  type="submit"
                  className="save-password-button"
                >
                  <KeyRound size={15} />

                  پاسورڈ محفوظ کریں
                </button>

              </form>

            </div>

          </div>
        )}

      </div>


      {/* =====================================================
          ALL STYLES
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #06101f;
        }

        body {
          font-family:
            Arial,
            "Noto Nastaliq Urdu",
            sans-serif;
        }


        /* ===================================================
           MAIN APP
        =================================================== */

        .app-shell {
          min-height: 100vh;

          color: #ffffff;

          direction: rtl;

          display: flex;

          flex-direction: column;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(14, 165, 233, 0.10),
              transparent 30%
            ),
            linear-gradient(
              180deg,
              #071426 0%,
              #081426 45%,
              #06101f 100%
            );
        }


        /* ===================================================
           HEADER
        =================================================== */

        .premium-header {
          width: 100%;

          position: sticky;

          top: 0;

          z-index: 50;

          overflow: visible;

          background:
            linear-gradient(
              135deg,
              rgba(5, 19, 36, 0.98),
              rgba(7, 28, 49, 0.98),
              rgba(4, 17, 33, 0.98)
            );

          border-bottom:
            1px solid rgba(56, 189, 248, 0.14);

          box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.28);
        }


        .header-inner {
          position: relative;

          z-index: 2;

          width: 100%;

          max-width: 1500px;

          min-height: 100px;

          margin: 0 auto;

          padding: 12px 22px;

          display: grid;

          grid-template-columns:
            minmax(210px, 0.8fr)
            minmax(300px, 1.45fr)
            minmax(190px, 0.75fr);

          grid-template-areas:
            "brand banner actions";

          align-items: center;

          gap: 22px;

          direction: rtl;
        }


        .header-glow {
          position: absolute;

          border-radius: 999px;

          filter: blur(60px);

          pointer-events: none;
        }


        .header-glow-one {
          width: 250px;
          height: 100px;

          right: 5%;

          top: -50px;

          background:
            rgba(6, 182, 212, 0.12);
        }


        .header-glow-two {
          width: 300px;
          height: 100px;

          left: 25%;

          bottom: -70px;

          background:
            rgba(37, 99, 235, 0.10);
        }


        /* ===================================================
           ONE CLICK BRAND
        =================================================== */

        .brand-area {
          grid-area: brand;

          display: flex;

          align-items: center;

          justify-content: flex-start;

          gap: 12px;

          min-width: 0;
        }


        .brand-logo-wrap {
          width: 68px;
          height: 68px;

          flex-shrink: 0;

          position: relative;

          border-radius: 20px;

          padding: 3px;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.95),
              rgba(8, 47, 73, 0.85)
            );

          border:
            1px solid rgba(34, 211, 238, 0.50);

          box-shadow:
            0 0 22px rgba(6, 182, 212, 0.16),
            inset 0 0 15px rgba(56, 189, 248, 0.06);

          overflow: visible;
        }


        .brand-logo {
          width: 100%;
          height: 100%;

          object-fit: contain;

          border-radius: 17px;
        }


        .online-dot {
          position: absolute;

          bottom: -3px;
          left: -3px;

          width: 16px;
          height: 16px;

          border-radius: 50%;

          background: #22c55e;

          border: 3px solid #071426;

          box-shadow:
            0 0 12px rgba(34, 197, 94, 0.8);
        }


        .brand-text {
          min-width: 0;
        }


        .brand-name {
          direction: ltr;

          white-space: nowrap;

          font-size: 24px;

          line-height: 1.05;

          font-weight: 900;

          letter-spacing: -0.7px;
        }


        .brand-one {
          color: #f8fafc;
        }


        .brand-click {
          color: #22d3ee;

          text-shadow:
            0 0 15px rgba(34, 211, 238, 0.22);
        }


        .brand-subtitle {
          margin-top: 6px;

          color: #64748b;

          font-size: 10px;

          font-weight: 700;

          white-space: nowrap;
        }


        /* ===================================================
           HAIDER FIBER BANNER
        =================================================== */

        .haider-banner-area {
          grid-area: banner;

          position: relative;

          width: 100%;

          max-width: 610px;

          justify-self: center;

          display: flex;

          align-items: center;

          justify-content: center;
        }


        .haider-banner-glow {
          position: absolute;

          width: 90%;
          height: 65%;

          border-radius: 50%;

          background:
            rgba(34, 197, 94, 0.09);

          filter: blur(35px);

          pointer-events: none;
        }


        .haider-banner-frame {
          position: relative;

          z-index: 2;

          width: 100%;

          height: 76px;

          padding: 3px;

          overflow: hidden;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,0.98),
              rgba(240,249,255,0.98)
            );

          border:
            1px solid rgba(125, 211, 252, 0.45);

          box-shadow:
            0 8px 28px rgba(0,0,0,0.20),
            0 0 18px rgba(56,189,248,0.08);
        }


        .haider-banner-image {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: contain;

          border-radius: 9px;
        }


        /* ===================================================
           HEADER ACTIONS
        =================================================== */

        .header-actions {
          grid-area: actions;

          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 9px;

          direction: rtl;
        }


        .dashboard-button {
          min-height: 42px;

          padding: 0 12px;

          border-radius: 12px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          color: #7dd3fc;

          text-decoration: none;

          font-size: 10px;

          font-weight: 800;

          background:
            rgba(15, 23, 42, 0.75);

          border:
            1px solid rgba(56, 189, 248, 0.22);

          transition:
            all 0.2s ease;
        }


        .dashboard-button:hover {
          border-color:
            rgba(56, 189, 248, 0.55);

          background:
            rgba(14, 165, 233, 0.10);
        }


        /* ===================================================
           PROFILE
        =================================================== */

        .profile-container {
          position: relative;
        }


        .profile-button {
          min-height: 48px;

          padding: 5px 7px 5px 10px;

          border-radius: 14px;

          border:
            1px solid rgba(56, 189, 248, 0.24);

          background:
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.90),
              rgba(11, 32, 55, 0.88)
            );

          color: #ffffff;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 7px;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03);

          transition:
            all 0.2s ease;
        }


        .profile-button:hover {
          border-color:
            rgba(34, 211, 238, 0.45);
        }


        .profile-icon {
          width: 36px;
          height: 36px;

          border-radius: 11px;

          display: flex;

          align-items: center;

          justify-content: center;

          color: #22d3ee;

          background:
            rgba(6, 182, 212, 0.12);

          border:
            1px solid rgba(34, 211, 238, 0.10);
        }


        .profile-name {
          max-width: 85px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          font-size: 10px;

          font-weight: 800;
        }


        .chevron {
          color: #64748b;

          transition:
            transform 0.2s ease;
        }


        .chevron-open {
          transform: rotate(180deg);
        }


        /* ===================================================
           PROFILE DROPDOWN
        =================================================== */

        .profile-menu {
          position: absolute;

          top: calc(100% + 9px);

          left: 0;

          width: 210px;

          overflow: hidden;

          border-radius: 15px;

          background:
            rgba(8, 22, 40, 0.99);

          border:
            1px solid rgba(56, 189, 248, 0.20);

          box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.45);

          z-index: 100;
        }


        .menu-top {
          padding: 12px;

          display: flex;

          align-items: center;

          gap: 9px;

          border-bottom:
            1px solid rgba(148,163,184,0.10);
        }


        .menu-avatar {
          width: 37px;
          height: 37px;

          flex-shrink: 0;

          border-radius: 11px;

          display: flex;

          align-items: center;

          justify-content: center;

          color: #22d3ee;

          background:
            rgba(6,182,212,0.12);
        }


        .menu-user-name {
          color: #f8fafc;

          font-size: 11px;

          font-weight: 900;
        }


        .menu-user-role {
          margin-top: 2px;

          color: #64748b;

          font-size: 8px;

          direction: ltr;
        }


        .menu-item {
          width: 100%;

          padding: 11px 13px;

          border: 0;

          background: transparent;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          text-align: right;

          font-size: 10px;

          font-weight: 800;
        }


        .password-item {
          color: #fbbf24;

          border-bottom:
            1px solid rgba(148,163,184,0.08);
        }


        .logout-item {
          color: #fb7185;
        }


        .menu-item:hover {
          background:
            rgba(255,255,255,0.035);
        }


        /* ===================================================
           CONTENT
        =================================================== */

        .page-content {
          flex: 1;

          width: 100%;

          max-width: 1400px;

          margin: 0 auto;

          padding: 18px 16px;
        }


        /* ===================================================
           FOOTER
        =================================================== */

        .premium-footer {
          margin-top: 24px;

          position: relative;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #071426,
              #0a1a2e
            );

          border-top:
            1px solid rgba(56,189,248,0.10);
        }


        .footer-line {
          height: 1px;

          width: 100%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(34,211,238,0.55),
              rgba(59,130,246,0.50),
              transparent
            );
        }


        .footer-content {
          min-height: 72px;

          max-width: 1400px;

          margin: 0 auto;

          padding: 12px 18px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          flex-wrap: wrap;
        }


        .footer-copyright {
          display: flex;

          align-items: center;

          gap: 6px;

          color: #64748b;

          font-size: 9px;

          font-weight: 600;
        }


        .footer-shield {
          color: #22c55e;
        }


        .footer-separator {
          color: #334155;
        }


        .powered-wrapper {
          direction: ltr;

          display: flex;

          align-items: center;

          gap: 5px;

          padding: 6px 11px;

          border-radius: 999px;

          background:
            rgba(6,182,212,0.06);

          border:
            1px solid rgba(34,211,238,0.12);
        }


        .powered-icon {
          color: #22d3ee;
        }


        .powered-small {
          color: #64748b;

          font-size: 8px;

          font-weight: 600;
        }


        .powered-name {
          color: #22d3ee;

          font-size: 9px;

          font-weight: 900;

          letter-spacing: 0.15px;

          text-shadow:
            0 0 10px rgba(34,211,238,0.14);
        }


        /* ===================================================
           MODAL
        =================================================== */

        .modal-overlay {
          position: fixed;

          inset: 0;

          z-index: 200;

          padding: 16px;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            rgba(1, 8, 18, 0.78);

          backdrop-filter: blur(8px);
        }


        .password-modal {
          width: 100%;

          max-width: 350px;

          position: relative;

          padding: 23px;

          border-radius: 18px;

          text-align: center;

          background:
            linear-gradient(
              145deg,
              #0c1c31,
              #071426
            );

          border:
            1px solid rgba(56,189,248,0.22);

          box-shadow:
            0 30px 70px rgba(0,0,0,0.50);
        }


        .modal-close {
          position: absolute;

          top: 12px;
          left: 12px;

          width: 31px;
          height: 31px;

          border: 0;

          border-radius: 9px;

          display: flex;

          align-items: center;

          justify-content: center;

          cursor: pointer;

          color: #64748b;

          background:
            rgba(255,255,255,0.035);
        }


        .modal-icon {
          width: 48px;
          height: 48px;

          margin: 0 auto 10px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 14px;

          color: #22d3ee;

          background:
            rgba(6,182,212,0.12);

          border:
            1px solid rgba(34,211,238,0.15);
        }


        .modal-title {
          margin: 0;

          color: #f8fafc;

          font-size: 15px;

          font-weight: 900;
        }


        .modal-description {
          margin: 5px 0 15px;

          color: #64748b;

          font-size: 9px;
        }


        .success-message {
          margin-bottom: 10px;

          padding: 9px 10px;

          border-radius: 9px;

          display: flex;

          align-items: center;

          gap: 6px;

          text-align: right;

          color: #34d399;

          font-size: 10px;

          background:
            rgba(16,185,129,0.10);

          border:
            1px solid rgba(16,185,129,0.25);
        }


        .password-form {
          display: flex;

          flex-direction: column;

          gap: 10px;
        }


        .password-input {
          width: 100%;

          padding: 10px 12px;

          border-radius: 10px;

          outline: none;

          color: #ffffff;

          font-size: 11px;

          background: #061323;

          border:
            1px solid rgba(100,116,139,0.30);
        }


        .password-input:focus {
          border-color:
            rgba(34,211,238,0.55);
        }


        .save-password-button {
          width: 100%;

          padding: 10px;

          border: 0;

          border-radius: 10px;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          color: #ffffff;

          font-size: 11px;

          font-weight: 900;

          background:
            linear-gradient(
              135deg,
              #0891b2,
              #2563eb
            );

          box-shadow:
            0 8px 20px rgba(37,99,235,0.20);
        }


        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 900px) {

          .header-inner {
            grid-template-columns:
              minmax(170px, 0.8fr)
              minmax(240px, 1.3fr)
              auto;

            gap: 12px;

            padding:
              10px 12px;
          }


          .haider-banner-frame {
            height: 65px;
          }


          .brand-logo-wrap {
            width: 58px;
            height: 58px;

            border-radius: 17px;
          }


          .brand-logo {
            border-radius: 14px;
          }


          .brand-name {
            font-size: 19px;
          }


          .brand-subtitle {
            font-size: 8px;
          }


          .profile-name {
            display: none;
          }


          .dashboard-button span {
            display: none;
          }


          .dashboard-button {
            width: 43px;
            padding: 0;
          }

        }


        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 650px) {

          .premium-header {
            position: sticky;
          }


          .header-inner {
            min-height: auto;

            padding:
              10px 10px 11px;

            grid-template-columns:
              1fr auto;

            grid-template-areas:
              "brand actions"
              "banner banner";

            gap:
              10px 8px;
          }


          /* ONE CLICK */

          .brand-area {
            justify-content: flex-start;

            gap: 8px;
          }


          .brand-logo-wrap {
            width: 53px;
            height: 53px;

            border-radius: 15px;
          }


          .brand-logo {
            border-radius: 12px;
          }


          .online-dot {
            width: 13px;
            height: 13px;

            border-width: 2px;
          }


          .brand-name {
            font-size: 18px;
          }


          .brand-subtitle {
            margin-top: 4px;

            font-size: 7.5px;
          }


          /* ACTION */

          .header-actions {
            gap: 6px;
          }


          .profile-button {
            min-height: 45px;

            padding: 4px 6px;

            border-radius: 13px;
          }


          .profile-icon {
            width: 34px;
            height: 34px;
          }


          .profile-name {
            display: none;
          }


          .dashboard-button {
            width: 42px;
            min-height: 42px;

            padding: 0;
          }


          .dashboard-button span {
            display: none;
          }


          /* HAIDER FIBER IMAGE */

          .haider-banner-area {
            width: 100%;

            max-width: none;
          }


          .haider-banner-frame {
            width: 100%;

            height: 67px;

            border-radius: 11px;
          }


          .haider-banner-image {
            object-fit: contain;

            border-radius: 8px;
          }


          /* CONTENT */

          .page-content {
            padding:
              14px 10px;
          }


          /* FOOTER */

          .footer-content {
            min-height: 85px;

            padding:
              12px 10px;

            justify-content: center;

            flex-direction: column;

            gap: 8px;
          }


          .footer-copyright {
            justify-content: center;

            flex-wrap: wrap;

            text-align: center;

            font-size: 8px;
          }


          .powered-name {
            font-size: 9px;
          }


          .profile-menu {
            left: 0;

            width: 195px;
          }

        }


        /* ===================================================
           SMALL MOBILE
        =================================================== */

        @media (max-width: 390px) {

          .brand-name {
            font-size: 16px;
          }


          .brand-subtitle {
            font-size: 7px;
          }


          .brand-logo-wrap {
            width: 48px;
            height: 48px;
          }


          .profile-icon {
            width: 31px;
            height: 31px;
          }


          .profile-button {
            min-height: 41px;
          }


          .haider-banner-frame {
            height: 61px;
          }

        }

      `}</style>

    </>
  );
}