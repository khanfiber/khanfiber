import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  CreditCard, 
  Activity, 
  Package, 
  AlertTriangle, 
  User, 
  Info, 
  Wifi, 
  Gauge, 
  DollarSign,
  Clock,
  Sparkles
} from 'lucide-react';

interface CustomerDataType {
  id: number;
  full_name: string;
  pppoe_username: string;
  phone: string;
  address: string;
  package_name: string;
  speed: string;
  monthly_price: number;
  remaining_balance?: number;
}

export default function UserDashboard() {
  const [customer, setCustomer] = useState<CustomerDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const customerId = parsedUser.id || parsedUser.customer_id;

          // Supabase سے کسٹمر کی لائیو انفارمیشن فیچ کریں
          const { data: custData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

          // آخری وصولی (Collection) سے بقایا رقم (Remaining Balance) فیچ کریں
          const { data: colData } = await supabase
            .from('collections')
            .select('remaining_balance')
            .eq('customer_id', customerId)
            .order('id', { ascending: false })
            .limit(1);

          const remainingArrears = colData && colData.length > 0 
            ? colData[0].remaining_balance 
            : (custData?.connection_charges || 0);

          if (custData) {
            setCustomer({
              ...custData,
              remaining_balance: remainingArrears
            });
          } else {
            setCustomer(parsedUser);
          }
        }
      } catch (err) {
        console.error('User Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 1. ویلکم بینر */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '16px', 
          padding: '16px 20px', 
          border: '1px solid #3b82f6',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
              <Sparkles size={14} />
              خوش آمدید!
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
              محترم {loading ? '...' : (customer?.full_name || 'صارف')}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd', direction: 'ltr', textAlign: 'right' }}>
              Account ID: {customer?.pppoe_username || '---'}
            </p>
          </div>

          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={14} /> سٹیٹس: ایکٹیو (Active)
            </span>
          </div>
        </div>

        {/* 2. انفارمیشن کارڈز (پیکج، سپیڈ، ماہانہ بل، اور بقایا رقم) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          width: '100%'
        }}>

          {/* پیکیج نام */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #f472b6', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>انٹرنیٹ پیکیج</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                {loading ? '...' : (customer?.package_name || 'Standard')}
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(244, 114, 182, 0.2)', padding: '10px', borderRadius: '10px', color: '#f472b6' }}>
              <Package size={20} />
            </div>
          </div>

          {/* انٹرنیٹ سپیڈ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #38bdf8', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>سپیڈ (Speed)</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>
                {loading ? '...' : (customer?.speed || '10 Mbps')}
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}>
              <Gauge size={20} />
            </div>
          </div>

          {/* ماہانہ بل */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #34d399', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>ماہانہ بل</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>
                Rs {loading ? '...' : (customer?.monthly_price || 0)}
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
              <DollarSign size={20} />
            </div>
          </div>

          {/* کل بقایا رقم (Remaining Arrears) */}
          <div style={{ backgroundColor: '#1c2541', border: `1px solid ${(customer?.remaining_balance || 0) > 0 ? '#ef4444' : '#10b981'}`, borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>کل بقایا رقم (Arrears)</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: (customer?.remaining_balance || 0) > 0 ? '#f87171' : '#34d399' }}>
                Rs {loading ? '...' : (customer?.remaining_balance || 0)}
              </h3>
            </div>
            <div style={{ backgroundColor: (customer?.remaining_balance || 0) > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '10px', color: (customer?.remaining_balance || 0) > 0 ? '#f87171' : '#34d399' }}>
              <Clock size={20} />
            </div>
          </div>

        </div>

        {/* 3. یوزر نیویگیشن بٹنز (Quick Actions) */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            ⚡ کوئیک مینو (Quick Actions)
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            width: '100%'
          }}>

            {/* 1. پے بل (Pay Bill) */}
            <Link href="/user/pay-bill" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #10b981', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
                  <CreditCard size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>پے بل (Pay Bill)</span>
              </div>
            </Link>

            {/* 2. چیک سپیڈ */}
            <Link href="/user/check-speed" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px', color: '#60a5fa' }}>
                  <Activity size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>چیک سپیڈ</span>
              </div>
            </Link>

            {/* 3. پیکج */}
            <Link href="/user/packages" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #f472b6', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(244, 114, 182, 0.2)', padding: '10px', borderRadius: '10px', color: '#f472b6' }}>
                  <Package size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>پیکج تفصیل</span>
              </div>
            </Link>

            {/* 4. شکایات */}
            <Link href="/user/complaints" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #ef4444', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', color: '#f87171' }}>
                  <AlertTriangle size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>درج شکایات</span>
              </div>
            </Link>

            {/* 5. مائی پروفائل */}
            <Link href="/user/profile" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #fbbf24', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '10px', color: '#fbbf24' }}>
                  <User size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>مائی پروفائل</span>
              </div>
            </Link>

            {/* 6. کنکشن معلومات */}
            <Link href="/user/connection-info" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #06b6d4', borderRadius: '12px', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '10px', color: '#22d3ee' }}>
                  <Info size={20} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>کنکشن معلومات</span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </Layout>
  );
}