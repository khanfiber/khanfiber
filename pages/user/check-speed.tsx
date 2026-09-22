import React from 'react';
import Layout from '../../components/Layout';
import { Gauge, RefreshCw, Activity } from 'lucide-react';

export default function CheckSpeedPage() {
  const handleRefresh = () => {
    const iframe = document.getElementById('fast-speed-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          border: '1px solid #3b82f6', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#38bdf8' }}>
              <Gauge size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#38bdf8', fontWeight: 'bold' }}>لائیو انٹرنیٹ سپیڈ ٹیسٹ (Live Speed Test)</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنے خان فائبر انٹرنیٹ کنکشن کی لائیو ڈاؤن لوڈ اور اپ لوڈ سپیڈ چیک کریں</p>
            </div>
          </div>

          <button 
            onClick={handleRefresh}
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#fff', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <RefreshCw size={14} /> دوبارہ ٹیسٹ کریں
          </button>
        </div>

        {/* 2. فاسٹ سپیڈ ٹیسٹنگ فریم (Embedded Fast.com) */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          border: '2px solid #3b82f6', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          height: '520px',
          width: '100%',
          position: 'relative'
        }}>
          <iframe 
            id="fast-speed-iframe"
            src="https://fast.com" 
            title="Fast Speed Test"
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none' 
            }}
          />
        </div>

      </div>
    </Layout>
  );
}