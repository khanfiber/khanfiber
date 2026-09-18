import React, { ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  showNavButtons?: boolean;
}

export default function Layout({ children, showNavButtons = true }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#0b132b', color: '#ffffff' }} dir="rtl">
      
      {/* 1. ہیڈر (نیلا بیک گراؤنڈ، پنک بڑا ٹیکسٹ) */}
      <header style={{ 
        height: '70px', 
        backgroundColor: '#1c2541', 
        borderBottom: '2px solid #ec4899', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexShrink: 0, 
        zIndex: 50,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
      }}>
        
        {/* لوگو اور بڑا عنوان */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #ec4899, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff', 
            fontWeight: '900', 
            fontSize: '16px', 
            border: '2px solid #f472b6', 
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.6)' 
          }}>
            KFN
          </div>
          
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#f472b6', 
              margin: 0, 
              lineHeight: '1.2',
              textShadow: '0 0 10px rgba(244, 114, 182, 0.4)'
            }}>
              خان فائبر انٹرنیٹ نیٹ ورک
            </h1>
            <p style={{ fontSize: '11px', color: '#93c5fd', margin: 0, tracking: '1px' }}>
              انٹرنیٹ سروسز مینجمنٹ پورٹل
            </p>
          </div>
        </div>

        {/* نیویگیشن بٹنز */}
        {showNavButtons && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/admin/dashboard" style={{ 
              backgroundColor: '#3b82f6', 
              color: '#ffffff', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              textDecoration: 'none', 
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
            }}>
              ہوم
            </Link>
            <Link href="/login" style={{ 
              backgroundColor: '#991b1b', 
              color: '#fca5a5', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              textDecoration: 'none', 
              border: '1px solid #ef4444' 
            }}>
              لاگ آؤٹ
            </Link>
          </div>
        )}
      </header>

      {/* 2. سکرولنگ مین باڈی */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* 3. فوٹر (کم چوڑائی، ہیڈر جیسی نیلے رنگ کی تھیم اور انگلش کریڈٹ) */}
      <footer style={{ 
        backgroundColor: '#1c2541', 
        borderTop: '1px solid #3b82f6', 
        padding: '6px 16px', 
        textAlign: 'center', 
        flexShrink: 0, 
        zIndex: 50,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <p style={{ fontSize: '11px', color: '#93c5fd', margin: 0 }}>
          © {new Date().getFullYear()} خان فائبر انٹرنیٹ نیٹ ورک - جملہ حقوق محفوظ ہیں۔
        </p>
        
        <p style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#f472b6', 
          margin: 0,
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.5px'
        }}>
          Powered by Saqaa Software Services
        </p>
      </footer>

    </div>
  );
}