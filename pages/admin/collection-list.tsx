import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  FileText, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface CustomerStatusType {
  id: number;
  full_name: string;
  father_name: string;
  pppoe_username: string;
  phone: string;
  monthly_price: number;
  last_paid_amount: number;
  remaining_balance: number;
  is_paid: boolean;
}

export default function CollectionListPage() {
  const [customers, setCustomers] = useState<CustomerStatusType[]>([]);
  const [activeTab, setActiveTab] = useState<'paid' | 'pending'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(true);

  // Supabase سے کسٹمرز اور ان کی آخری بلنگ وصولی فیچ کریں
  const fetchData = async () => {
    setFetching(true);
    
    // Step A: تمام کسٹمرز حاصل کریں
    const { data: custData } = await supabase.from('customers').select('*');
    
    // Step B: تمام وصولی (collections) کی تاریخ حاصل کریں
    const { data: colData } = await supabase
      .from('collections')
      .select('*')
      .order('id', { ascending: false });

    if (custData) {
      const formattedList: CustomerStatusType[] = custData.map((c) => {
        // اس کسٹمر کا سب سے آخری وصولی ریکارڈ تلاش کریں
        const customerCol = colData?.find((col) => col.customer_id === c.id);

        const remaining = customerCol ? customerCol.remaining_balance : c.monthly_price;
        const lastPaid = customerCol ? customerCol.paid_amount : 0;
        
        // اگر بقیہ رقم 0 یا اس سے کم ہو تو وصول، ورنہ پینڈنگ
        const isPaid = customerCol ? remaining <= 0 : false;

        return {
          id: c.id,
          full_name: c.full_name || 'نامعلوم',
          father_name: c.father_name || '---',
          pppoe_username: c.pppoe_username || '---',
          phone: c.phone || '---',
          monthly_price: c.monthly_price || 0,
          last_paid_amount: lastPaid,
          remaining_balance: remaining,
          is_paid: isPaid
        };
      });

      setCustomers(formattedList);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // اینالیٹکس کاؤنٹرز (Stats Counters)
  const totalUsers = customers.length;
  const paidCount = customers.filter(c => c.is_paid).length;
  const pendingCount = customers.filter(c => !c.is_paid).length;

  // سرچ کی بنیاد پر فلٹر
  const filteredCustomers = customers.filter((c) => {
    const matchesTab = activeTab === 'paid' ? c.is_paid : !c.is_paid;
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      c.full_name.toLowerCase().includes(search) ||
      c.pppoe_username.toLowerCase().includes(search) ||
      c.phone.includes(search);

    return matchesTab && matchesSearch;
  });

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* 1. ٹاپ بار */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#1c2541', 
          padding: '14px 20px', 
          borderRadius: '16px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '12px', color: '#a78bfa' }}>
              <FileText size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                لسٹ پیمنٹ وصولی (Collection Status List)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                وصول شدہ اور پینڈنگ بلز کی مکمل رپورٹ اور فلٹر لسٹ
              </p>
            </div>
          </div>

          <Link href="/admin/dashboard" style={{ 
            backgroundColor: '#0f172a', 
            color: '#38bdf8', 
            padding: '8px 16px', 
            borderRadius: '10px', 
            fontSize: '12px', 
            textDecoration: 'none', 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            border: '1px solid #334155'
          }}>
            <ArrowRight size={16} />
            ڈیش بورڈ پر واپس جائیں
          </Link>
        </div>

        {/* 2. ٹاپ کاؤنٹرز (Analytics Cards) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          width: '100%'
        }}>
          {/* کل صارفین */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>کل صارفین (Total)</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>{totalUsers}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px', color: '#60a5fa' }}>
              <Users size={24} />
            </div>
          </div>

          {/* وصول شدہ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #10b981', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>وصول شدہ بل (Collected)</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#34d399' }}>{paidCount}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* بقیہ پینڈنگ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>پینڈنگ بل (Pending)</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#f87171' }}>{pendingCount}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', color: '#f87171' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* 3. سرچ اور سوئچر ٹیبز (Switcher Bar) */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '16px', 
          padding: '16px', 
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* ٹیب سوئچر */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #334155',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'pending' ? '#991b1b' : 'transparent',
                color: activeTab === 'pending' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Clock size={16} />
              پینڈنگ لسٹ ({pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'paid' ? '#065f46' : 'transparent',
                color: activeTab === 'paid' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              وصول لسٹ ({paidCount})
            </button>
          </div>

          {/* سرچ بار اور ریفریش */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text"
                placeholder="صارف کے نام، PPPoE یوزر نیم یا فون سے سرچ کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              />
              <Search size={18} style={{ position: 'absolute', right: '12px', top: '11px', color: '#64748b' }} />
            </div>

            <button 
              onClick={fetchData}
              style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '10px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
              ریفریش
            </button>
          </div>
        </div>

        {/* 4. وصولی / پینڈنگ ٹیبل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '20px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#38bdf8' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>صارف کا نام</th>
                  <th style={{ padding: '12px' }}>PPPoE یوزر نیم</th>
                  <th style={{ padding: '12px' }}>فون نمبر</th>
                  <th style={{ padding: '12px' }}>ماہانہ پیکج بل</th>
                  <th style={{ padding: '12px' }}>جمع شدہ رقم</th>
                  <th style={{ padding: '12px' }}>بقیہ بقایا (Remaining)</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>سٹیٹس</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      کوئی ریکارڈ موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((user, index) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                        {user.full_name}
                      </td>
                      <td style={{ padding: '12px', color: '#38bdf8', direction: 'ltr', textAlign: 'right', fontWeight: 'bold' }}>
                        {user.pppoe_username}
                      </td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>
                        {user.phone}
                      </td>
                      <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                        Rs {user.monthly_price}
                      </td>
                      <td style={{ padding: '12px', color: '#34d399', fontWeight: 'bold' }}>
                        Rs {user.last_paid_amount}
                      </td>
                      <td style={{ padding: '12px', color: user.remaining_balance > 0 ? '#f87171' : '#34d399', fontWeight: 'bold', fontSize: '14px' }}>
                        Rs {user.remaining_balance}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {user.is_paid ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> وصول شدہ
                          </span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> پینڈنگ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}