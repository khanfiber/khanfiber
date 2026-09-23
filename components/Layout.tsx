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
  Sparkles,
  LockKeyhole,
} from 'lucide-react';

export default function Layout({
  children,
  showNavButtons = true,
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
      } catch {
        localStorage.removeItem('user');
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
    <div className="appShell">

      {/* =========================
          PREMIUM HEADER
      ========================== */}
      <header className="premiumHeader">
        <div className="headerGlow" />

        {/* Brand / Logo */}
        <div className="brandArea">

          <div className="logoOuter">
            <div className="logoInner">
              <img
                src="/logo.png"
                alt="One Click Logo"
                className="brandLogo"
              />
            </div>

            <div className="onlineDot" />
          </div>

          <div className="brandText">
            <div className="brandTitleRow">
              <h1 className="brandTitle">
                One Click
              </h1>

              <span className="premiumBadge">
                <Sparkles size={10} />
                PREMIUM
              </span>
            </div>

            <p className="brandSubtitle">
              اسمارٹ ISP مینجمنٹ پورٹل
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="headerActions">

          {showNavButtons &&
            router.pathname !== '/admin/dashboard' && (
              <Link
                href="/admin/dashboard"
                className="dashboardButton"
              >
                <ArrowRight size={15} />

                <span className="dashboardText">
                  ڈیش بورڈ
                </span>
              </Link>
            )}

          {/* Profile Menu */}
          <div className="profileWrapper" ref={menuRef}>

            <button
              type="button"
              className={`profileButton ${
                showMenu ? 'profileActive' : ''
              }`}
              onClick={() => setShowMenu(!showMenu)}
            >
              <div className="profileIcon">
                <User size={16} />
              </div>

              <span className="profileName">
                {user?.full_name ||
                  (user?.role === 'admin'
                    ? 'ایڈمن'
                    : 'اکاؤنٹ')}
              </span>

              <ChevronDown
                size={14}
                className={`chevron ${
                  showMenu ? 'rotateChevron' : ''
                }`}
              />
            </button>

            {showMenu && (
              <div className="profileDropdown">

                <div className="dropdownHeader">
                  <div className="dropdownAvatar">
                    <User size={20} />
                  </div>

                  <div>
                    <div className="dropdownUserName">
                      {user?.full_name ||
                        (user?.role === 'admin'
                          ? 'Administrator'
                          : 'User')}
                    </div>

                    <div className="dropdownRole">
                      {user?.role === 'admin'
                        ? 'Administrator Account'
                        : 'Customer Account'}
                    </div>
                  </div>
                </div>

                <div className="dropdownDivider" />

                <button
                  type="button"
                  className="menuItem passwordItem"
                  onClick={() => {
                    setShowPasswordModal(true);
                    setShowMenu(false);
                  }}
                >
                  <div className="menuIcon passwordIcon">
                    <KeyRound size={16} />
                  </div>

                  <span>پاسورڈ تبدیل کریں</span>
                </button>

                <button
                  type="button"
                  className="menuItem logoutItem"
                  onClick={handleLogout}
                >
                  <div className="menuIcon logoutIcon">
                    <LogOut size={16} />
                  </div>

                  <span>لاگ آؤٹ کریں</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================
          PAGE CONTENT
      ========================== */}
      <main className="mainContent">
        {children}
      </main>

      {/* =========================
          PREMIUM FOOTER
      ========================== */}
      <footer className="premiumFooter">

        <div className="footerGlow" />

        <div className="footerContent">

          <div className="copyright">
            <ShieldCheck size={16} />

            <span>
              © {new Date().getFullYear()} One Click
            </span>

            <span className="copyrightDivider">•</span>

            <span>تمام حقوق محفوظ ہیں</span>
          </div>

          <div className="poweredArea">
            <span className="poweredLabel">
              POWERED BY
            </span>

            <div className="saqaaBrand">
              <span className="saqaaDot" />
              <span>Saqaa Software Services</span>
            </div>
          </div>

        </div>
      </footer>

      {/* =========================
          CHANGE PASSWORD MODAL
      ========================== */}
      {showPasswordModal && (
        <div
          className="modalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
            }
          }}
        >
          <div className="modalBox">

            <div className="modalTopGlow" />

            <button
              type="button"
              className="modalClose"
              onClick={() =>
                setShowPasswordModal(false)
              }
            >
              <X size={19} />
            </button>

            <div className="modalIcon">
              <LockKeyhole size={24} />
            </div>

            <h3 className="modalTitle">
              پاسورڈ تبدیل کریں
            </h3>

            <p className="modalDescription">
              اپنے اکاؤنٹ کے لیے نیا محفوظ پاسورڈ درج کریں
            </p>

            {msg && (
              <div className="successMessage">
                <CheckCircle2 size={16} />
                <span>{msg}</span>
              </div>
            )}

            <form
              onSubmit={handleChangePassword}
              className="passwordForm"
            >
              <label className="inputLabel">
                نیا پاسورڈ
              </label>

              <div className="inputWrapper">
                <KeyRound
                  size={16}
                  className="inputIcon"
                />

                <input
                  type="password"
                  required
                  placeholder="نیا پاسورڈ ٹائپ کریں"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="passwordInput"
                />
              </div>

              <button
                type="submit"
                className="savePasswordButton"
              >
                <ShieldCheck size={17} />
                پاسورڈ محفوظ کریں
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          STYLES
      ========================== */}
      <style jsx>{`
        .appShell {
          min-height: 100vh;
          color: #f8fafc;
          direction: rtl;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          display: flex;
          flex-direction: column;

          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(0, 194, 255, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 10%,
              rgba(59, 130, 246, 0.07),
              transparent 25%
            ),
            linear-gradient(
              180deg,
              #07111f 0%,
              #081426 50%,
              #07101e 100%
            );
        }

        /* =========================
           HEADER
        ========================== */

        .premiumHeader {
          min-height: 78px;
          padding: 10px 22px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          position: sticky;
          top: 0;
          z-index: 50;

          background: rgba(8, 20, 38, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          border-bottom: 1px solid
            rgba(56, 189, 248, 0.15);

          box-shadow:
            0 10px 35px rgba(0, 0, 0, 0.28),
            inset 0 -1px 0
              rgba(255, 255, 255, 0.02);

          overflow: visible;
        }

        .headerGlow {
          position: absolute;
          width: 250px;
          height: 70px;
          right: 8%;
          top: -50px;

          background: #00c8ff;
          filter: blur(80px);
          opacity: 0.12;

          pointer-events: none;
        }

        .brandArea {
          display: flex;
          align-items: center;
          gap: 13px;
          position: relative;
          z-index: 2;
        }

        .logoOuter {
          width: 57px;
          height: 57px;

          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 17px;

          padding: 2px;

          background:
            linear-gradient(
              135deg,
              #22d3ee,
              #2563eb,
              #0ea5e9
            );

          box-shadow:
            0 0 0 3px
              rgba(14, 165, 233, 0.07),
            0 7px 22px
              rgba(0, 174, 255, 0.22);
        }

        .logoInner {
          width: 100%;
          height: 100%;

          border-radius: 15px;
          overflow: hidden;

          background: #071426;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brandLogo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .onlineDot {
          position: absolute;
          width: 10px;
          height: 10px;

          bottom: -2px;
          left: -2px;

          border-radius: 50%;

          background: #22c55e;
          border: 2px solid #081426;

          box-shadow:
            0 0 10px
              rgba(34, 197, 94, 0.8);
        }

        .brandText {
          min-width: 0;
        }

        .brandTitleRow {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brandTitle {
          margin: 0;

          direction: ltr;

          font-size: 23px;
          line-height: 1.15;

          font-weight: 900;
          letter-spacing: -0.5px;

          background:
            linear-gradient(
              90deg,
              #ffffff 0%,
              #67e8f9 45%,
              #38bdf8 100%
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;

          filter:
            drop-shadow(
              0 3px 8px
                rgba(56, 189, 248, 0.2)
            );
        }

        .premiumBadge {
          direction: ltr;

          display: inline-flex;
          align-items: center;
          gap: 3px;

          padding: 3px 6px;

          border-radius: 20px;

          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.7px;

          color: #67e8f9;

          border: 1px solid
            rgba(34, 211, 238, 0.2);

          background:
            rgba(6, 182, 212, 0.08);
        }

        .brandSubtitle {
          margin: 5px 0 0;

          font-size: 10px;
          font-weight: 500;

          color: #7f94ad;

          letter-spacing: 0.1px;
        }

        /* =========================
           HEADER ACTIONS
        ========================== */

        .headerActions {
          display: flex;
          align-items: center;
          gap: 9px;

          position: relative;
          z-index: 5;
        }

        .dashboardButton {
          min-height: 38px;

          padding: 0 13px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          gap: 6px;

          text-decoration: none;

          color: #7dd3fc;

          font-size: 11px;
          font-weight: 700;

          background:
            rgba(15, 36, 62, 0.7);

          border: 1px solid
            rgba(56, 189, 248, 0.2);

          transition: 0.2s ease;

          box-shadow:
            inset 0 1px 0
              rgba(255, 255, 255, 0.03);
        }

        .dashboardButton:hover {
          color: #ffffff;

          border-color:
            rgba(56, 189, 248, 0.5);

          background:
            rgba(14, 165, 233, 0.12);

          transform: translateY(-1px);
        }

        /* =========================
           PROFILE
        ========================== */

        .profileWrapper {
          position: relative;
        }

        .profileButton {
          min-height: 40px;

          padding: 4px 10px 4px 6px;

          display: flex;
          align-items: center;
          gap: 7px;

          border-radius: 12px;

          color: #e2e8f0;

          background:
            rgba(15, 36, 62, 0.75);

          border: 1px solid
            rgba(59, 130, 246, 0.25);

          cursor: pointer;

          transition: 0.2s ease;

          box-shadow:
            inset 0 1px 0
              rgba(255, 255, 255, 0.03);
        }

        .profileButton:hover,
        .profileActive {
          border-color:
            rgba(34, 211, 238, 0.55);

          background:
            rgba(14, 165, 233, 0.1);

          box-shadow:
            0 0 18px
              rgba(14, 165, 233, 0.08);
        }

        .profileIcon {
          width: 28px;
          height: 28px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #67e8f9;

          background:
            linear-gradient(
              135deg,
              rgba(6, 182, 212, 0.2),
              rgba(37, 99, 235, 0.15)
            );

          border: 1px solid
            rgba(34, 211, 238, 0.12);
        }

        .profileName {
          font-size: 11px;
          font-weight: 700;

          white-space: nowrap;
          max-width: 90px;

          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chevron {
          color: #64748b;
          transition: 0.2s ease;
        }

        .rotateChevron {
          transform: rotate(180deg);
        }

        /* =========================
           DROPDOWN
        ========================== */

        .profileDropdown {
          position: absolute;

          top: calc(100% + 10px);
          left: 0;

          width: 225px;

          padding: 8px;

          border-radius: 16px;

          background:
            rgba(9, 23, 42, 0.98);

          backdrop-filter: blur(20px);

          border: 1px solid
            rgba(56, 189, 248, 0.2);

          box-shadow:
            0 20px 50px
              rgba(0, 0, 0, 0.5),
            0 0 30px
              rgba(14, 165, 233, 0.06);

          animation:
            dropdownIn 0.18s ease;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-7px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        .dropdownHeader {
          padding: 8px;

          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dropdownAvatar {
          width: 37px;
          height: 37px;

          flex-shrink: 0;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #67e8f9;

          background:
            linear-gradient(
              135deg,
              rgba(6, 182, 212, 0.18),
              rgba(37, 99, 235, 0.16)
            );

          border: 1px solid
            rgba(34, 211, 238, 0.15);
        }

        .dropdownUserName {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 800;
        }

        .dropdownRole {
          margin-top: 2px;

          direction: ltr;

          color: #64748b;
          font-size: 8px;
          font-weight: 600;
        }

        .dropdownDivider {
          height: 1px;
          margin: 5px 3px;

          background:
            rgba(148, 163, 184, 0.12);
        }

        .menuItem {
          width: 100%;

          padding: 9px;

          display: flex;
          align-items: center;
          gap: 9px;

          border: none;
          border-radius: 10px;

          cursor: pointer;

          font-size: 11px;
          font-weight: 700;

          background: transparent;

          transition: 0.18s ease;

          text-align: right;
        }

        .menuIcon {
          width: 29px;
          height: 29px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;
        }

        .passwordItem {
          color: #fbbf24;
        }

        .passwordItem:hover {
          background:
            rgba(245, 158, 11, 0.08);
        }

        .passwordIcon {
          background:
            rgba(245, 158, 11, 0.1);
        }

        .logoutItem {
          color: #fb7185;
        }

        .logoutItem:hover {
          background:
            rgba(244, 63, 94, 0.08);
        }

        .logoutIcon {
          background:
            rgba(244, 63, 94, 0.1);
        }

        /* =========================
           MAIN
        ========================== */

        .mainContent {
          width: 100%;
          max-width: 1400px;

          flex: 1;

          margin: 0 auto;
          padding: 20px 18px;

          box-sizing: border-box;
        }

        /* =========================
           FOOTER
        ========================== */

        .premiumFooter {
          position: relative;
          overflow: hidden;

          margin-top: 25px;

          padding: 18px 20px;

          background:
            linear-gradient(
              180deg,
              rgba(9, 23, 42, 0.8),
              rgba(5, 15, 29, 0.98)
            );

          border-top: 1px solid
            rgba(56, 189, 248, 0.12);

          box-shadow:
            0 -15px 40px
              rgba(0, 0, 0, 0.12);
        }

        .footerGlow {
          position: absolute;

          width: 300px;
          height: 70px;

          left: 50%;
          bottom: -65px;

          transform: translateX(-50%);

          background: #00b8ff;

          filter: blur(75px);
          opacity: 0.18;

          pointer-events: none;
        }

        .footerContent {
          position: relative;
          z-index: 2;

          max-width: 1400px;
          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;
        }

        .copyright {
          display: flex;
          align-items: center;
          gap: 6px;

          color: #64748b;

          font-size: 10px;
          font-weight: 500;
        }

        .copyright svg {
          color: #22c55e;

          filter:
            drop-shadow(
              0 0 5px
                rgba(34, 197, 94, 0.3)
            );
        }

        .copyrightDivider {
          color: #334155;
        }

        .poweredArea {
          direction: ltr;

          display: flex;
          align-items: center;
          gap: 8px;
        }

        .poweredLabel {
          font-size: 7px;
          font-weight: 800;

          letter-spacing: 1.4px;

          color: #475569;
        }

        .saqaaBrand {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 6px 10px;

          border-radius: 9px;

          font-size: 10px;
          font-weight: 800;

          color: #67e8f9;

          background:
            rgba(14, 165, 233, 0.06);

          border: 1px solid
            rgba(56, 189, 248, 0.12);

          box-shadow:
            inset 0 1px 0
              rgba(255, 255, 255, 0.02);
        }

        .saqaaDot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #22d3ee;

          box-shadow:
            0 0 8px
              rgba(34, 211, 238, 0.8);
        }

        /* =========================
           MODAL
        ========================== */

        .modalOverlay {
          position: fixed;
          inset: 0;

          z-index: 1000;

          padding: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(2, 8, 20, 0.82);

          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);

          animation:
            overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .modalBox {
          width: 100%;
          max-width: 365px;

          position: relative;
          overflow: hidden;

          padding: 25px;

          border-radius: 21px;

          background:
            linear-gradient(
              145deg,
              rgba(13, 30, 52, 0.99),
              rgba(7, 19, 36, 0.99)
            );

          border: 1px solid
            rgba(56, 189, 248, 0.22);

          box-shadow:
            0 30px 80px
              rgba(0, 0, 0, 0.65),
            0 0 40px
              rgba(14, 165, 233, 0.06);

          animation:
            modalIn 0.22s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform:
              scale(0.95)
              translateY(8px);
          }

          to {
            opacity: 1;
            transform:
              scale(1)
              translateY(0);
          }
        }

        .modalTopGlow {
          position: absolute;

          width: 180px;
          height: 60px;

          top: -50px;
          right: 50%;

          transform: translateX(50%);

          background: #00c8ff;

          filter: blur(60px);
          opacity: 0.25;
        }

        .modalClose {
          position: absolute;

          top: 14px;
          left: 14px;

          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          border: 1px solid
            rgba(148, 163, 184, 0.1);

          background:
            rgba(15, 23, 42, 0.6);

          color: #64748b;

          cursor: pointer;

          transition: 0.18s ease;
        }

        .modalClose:hover {
          color: #ffffff;

          background:
            rgba(244, 63, 94, 0.1);

          border-color:
            rgba(244, 63, 94, 0.2);
        }

        .modalIcon {
          width: 49px;
          height: 49px;

          margin-bottom: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 14px;

          color: #67e8f9;

          background:
            linear-gradient(
              135deg,
              rgba(6, 182, 212, 0.18),
              rgba(37, 99, 235, 0.16)
            );

          border: 1px solid
            rgba(34, 211, 238, 0.16);

          box-shadow:
            0 8px 25px
              rgba(14, 165, 233, 0.08);
        }

        .modalTitle {
          margin: 0;

          font-size: 17px;
          font-weight: 900;

          color: #f8fafc;
        }

        .modalDescription {
          margin: 6px 0 18px;

          color: #71839b;

          font-size: 10px;
          line-height: 1.7;
        }

        .successMessage {
          margin-bottom: 13px;
          padding: 10px;

          display: flex;
          align-items: center;
          gap: 7px;

          border-radius: 10px;

          color: #34d399;

          background:
            rgba(16, 185, 129, 0.08);

          border: 1px solid
            rgba(16, 185, 129, 0.2);

          font-size: 10px;
          font-weight: 700;
        }

        .passwordForm {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .inputLabel {
          color: #94a3b8;

          font-size: 10px;
          font-weight: 700;
        }

        .inputWrapper {
          position: relative;
        }

        .inputIcon {
          position: absolute;

          right: 12px;
          top: 50%;

          transform: translateY(-50%);

          color: #475569;
        }

        .passwordInput {
          width: 100%;

          box-sizing: border-box;

          padding:
            11px 38px
            11px 12px;

          border-radius: 11px;

          outline: none;

          color: #ffffff;

          background:
            rgba(3, 12, 25, 0.7);

          border: 1px solid
            rgba(100, 116, 139, 0.22);

          font-size: 11px;

          transition: 0.2s ease;
        }

        .passwordInput:focus {
          border-color:
            rgba(34, 211, 238, 0.55);

          box-shadow:
            0 0 0 3px
              rgba(6, 182, 212, 0.07);
        }

        .passwordInput::placeholder {
          color: #475569;
        }

        .savePasswordButton {
          margin-top: 5px;

          min-height: 42px;

          border: none;
          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          cursor: pointer;

          color: #ffffff;

          font-size: 11px;
          font-weight: 800;

          background:
            linear-gradient(
              135deg,
              #0891b2,
              #2563eb
            );

          box-shadow:
            0 8px 25px
              rgba(37, 99, 235, 0.18);

          transition: 0.2s ease;
        }

        .savePasswordButton:hover {
          transform: translateY(-1px);

          box-shadow:
            0 11px 30px
              rgba(37, 99, 235, 0.25);
        }

        /* =========================
           MOBILE
        ========================== */

        @media (max-width: 650px) {

          .premiumHeader {
            min-height: 70px;
            padding: 9px 11px;
          }

          .brandArea {
            gap: 8px;
          }

          .logoOuter {
            width: 46px;
            height: 46px;

            border-radius: 14px;
          }

          .logoInner {
            border-radius: 12px;
          }

          .brandTitle {
            font-size: 18px;
          }

          .premiumBadge {
            display: none;
          }

          .brandSubtitle {
            margin-top: 3px;
            font-size: 8px;
          }

          .headerActions {
            gap: 5px;
          }

          .dashboardButton {
            width: 36px;
            min-height: 36px;

            padding: 0;

            justify-content: center;
          }

          .dashboardText {
            display: none;
          }

          .profileButton {
            min-height: 37px;

            padding:
              3px 7px
              3px 4px;

            gap: 5px;
          }

          .profileIcon {
            width: 26px;
            height: 26px;
          }

          .profileName {
            max-width: 52px;
            font-size: 9px;
          }

          .profileDropdown {
            width: 205px;
          }

          .mainContent {
            padding: 15px 12px;
          }

          .premiumFooter {
            padding: 17px 10px;
          }

          .footerContent {
            flex-direction: column;
            justify-content: center;

            gap: 10px;
          }

          .copyright {
            justify-content: center;

            flex-wrap: wrap;

            font-size: 9px;
          }

          .saqaaBrand {
            font-size: 9px;
          }
        }

        /* Very Small Phones */
        @media (max-width: 390px) {

          .brandTitle {
            font-size: 16px;
          }

          .brandSubtitle {
            font-size: 7px;
          }

          .logoOuter {
            width: 43px;
            height: 43px;
          }

          .profileName {
            display: none;
          }

          .profileButton {
            padding: 3px 5px;
          }
        }
      `}</style>

    </div>
  );
}