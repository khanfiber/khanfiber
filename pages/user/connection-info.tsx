import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  Info, 
  Wifi, 
  Calendar, 
  Gauge, 
  Package, 
  ShieldCheck, 
  MapPin, 
  Router, 
  Hash, 
  Key, 
  DollarSign,
  Clock
} from 'lucide-react';

export default function ConnectionInfoPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectionDetails();
  }, []);

  const loadConnectionDetails = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const customerId = parsedUser.id || parsedUser.customer_id;

      // Supabase سے کسٹمر کی مکمل معلومات فیچ کریں
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      if (data) setCustomer(data);
    } catch (err) {
      console.error('Connection Info Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '850px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #06b6d4', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '8px', borderRadius: '10px', color: '#22d3ee' }}>
            <Info size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#22d3ee', fontWeight: 'bold' }}>کنکشن معلومات (Connection Info)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنے فائبر کنکشن کی مکمل تکنیکی اور نیٹ ورک کی تفصیلات دیکھیں</p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#38bdf8', padding: '30px 0', fontSize: '13px' }}>معلومات فیچ ہو رہی ہیں...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 1. سٹیٹس اور بنیادی شناخت */}
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              {/* سٹیٹس */}
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', color: '#34d399' }}>
                  <Wifi size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>کنکشن سٹیٹس</span>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#34d399', fontWeight: 'bold' }}>ایکٹیو (Active)</h4>
                </div>
              </div>

              {/* کسٹمر سیریل ID */}
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
                  <Hash size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>سیریل / کسٹمر نمبر</span>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', fontWeight: 'bold', direction: 'ltr', textAlign: 'right' }}>
                    {customer?.serial_number || '---'}
                  </h4>
                </div>
              </div>

              {/* کنکشن لگنے کی تاریخ */}
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '8px', color: '#fbbf24' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>کنکشن کی تاریخ</span>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#fbbf24', fontWeight: 'bold' }}>
                    {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('ur-PK') : '---'}
                  </h4>
                </div>
              </div>

            </div>

            {/* 2. پیکیج اور بلنگ انفارمیشن */}
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                ⚡ پیکیج و سپیڈ معلومات
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={12} style={{ color: '#f472b6' }} /> موجودہ پیکیج
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                    {customer?.package_name || 'Standard'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={12} style={{ color: '#38bdf8' }} /> الاٹ شدہ سپیڈ
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>
                    {customer?.speed || '10 Mbps'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={12} style={{ color: '#34d399' }} /> ماہانہ بل
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#34d399' }}>
                    Rs {customer?.monthly_price || 0}
                  </p>
                </div>

              </div>
            </div>

            {/* 3. نیٹ ورک اور ڈیوائس کریڈینشلز */}
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#22d3ee', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                🌐 نیٹ ورک و ڈیوائس سیٹنگز
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={12} style={{ color: '#fbbf24' }} /> PPPoE یوزر نیم
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', direction: 'ltr', textAlign: 'right' }}>
                    {customer?.pppoe_username || '---'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Router size={12} style={{ color: '#a78bfa' }} /> ONU / روٹر ڈیوائس
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>
                    {customer?.router_model || 'Fiber ONU Device'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ color: '#f87171' }} /> کنکشن ایڈریس
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    {customer?.address || 'پتہ درج نہیں ہے'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}