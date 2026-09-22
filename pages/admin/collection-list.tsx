import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Users,
  TrendingUp,
  CreditCard,
  MessageSquare
} from 'lucide-react';

interface CustomerStatusType {
  id: number;
  full_name: string;
  father_name: string;
  pppoe_username: string;
  phone: string;
  whatsapp: string;
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

  // لائیو اینالیٹکس رقوم
  const [totals, setTotals] = useState({
    collectedAmount: 0,
    pendingAmount: 0
  });

  // Supabase سے کسٹمرز اور ان کی بلنگ ہسٹری حاصل کرنا
  const fetchData = async () => {
    setFetching(true);
    try {
      // Step 1: تمام صارفین
      const { data: custData } = await supabase.from('customers').select('*');
      
      // Step 2: تمام بل وصولیاں
      const { data: colData } = await supabase
        .from('collections')
        .select('*')
        .order('id', { ascending: false });

      if (custData) {
        let totalCollected = 0;
        let totalPending = 0;

        const formattedList: CustomerStatusType[] = custData.map((c) => {
          // کسٹمر کی سب سے آخری وصولی ہسٹری
          const customerCols = colData?.filter((col) => col.customer_id === c.id) || [];
          const customerLatestCol = customerCols[0];

          // اگر پہلی بار ہے اور کوئی کلیکشن نہیں ہے تو کنکشن چارجز + ماہانہ بل ملائیں
          const initialCharges = Number(c.connection_charges || 0) + Number(c.monthly_price || 0);

          const remaining = customerLatestCol 
            ? Number(customerLatestCol.remaining_balance || 0) 
            : initialCharges;
            
          const lastPaid = customerLatestCol ? Number(customerLatestCol.paid_amount || 0) : 0;
          
          const isPaid = remaining <= 0;

          if (isPaid) {
            totalCollected += lastPaid;
          } else {
            totalPending += remaining;
          }

          return {
            id: c.id,
            full_name: c.full_name || 'نامعلوم',
            father_name: c.father_name || '---',
            pppoe_username: c.pppoe_username || '---',
            phone: c.phone || '---',
            whatsapp: c.whatsapp || c.phone || '---',
            monthly_price: Number(c.monthly_price || 0),
            last_paid_amount: lastPaid,
            remaining_balance: remaining,
            is_paid: isPaid
          };
        });

        setCustomers(formattedList);
        setTotals({
          collectedAmount: totalCollected,
          pendingAmount: totalPending
        });
      }
    } catch (err) {
      console.error('Fetch Collection Error:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // شمار
  const totalUsers = customers.length;
  const paidCount = customers.filter(c => c.is_paid).length;
  const pendingCount = customers.filter(c => !c.is_paid).length;

  // سرچ و فلٹر
  const filteredCustomers = customers.filter((c) => {
    const matchesTab = activeTab === 'paid' ? c.is_paid : !c.is_paid;
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      c.full_name.toLowerCase().includes(search) ||
      c.pppoe_username.toLowerCase().includes(search) ||
      c.phone.includes(search);

    return matchesTab && matchesSearch;
  });

  // پینڈنگ بل کا واٹس ایپ تذکیر میسج بھیجنے کا طریقہ
  const handleSendReminder = (customer: CustomerStatusType) => {
    const targetPhone = customer.whatsapp || customer.phone;
    if (!targetPhone || targetPhone === '---') {
      alert('اس صارف کا واٹس ایپ یا فون نمبر موجود نہیں ہے!');
      return;
    }

    const reminderMessage = 
      `*خان فائبر انٹرنیٹ نیٹ ورک - بل تذکیر (Reminder Notice)*\n\n` +
      `محترم *${customer.full_name}*!\n` +
      `آپ کا ماہانہ انٹرنیٹ بل *Rs ${customer.remaining_balance}* واجب الادا (پینڈنگ) ہے۔\n\n` +
      `⚠️ *برائے مہربانی اپنا بل جلد از جلد جمع کروائیں۔* وقت پر بل جمع نہ کروانے کی صورت میں آپ کا انٹرنیٹ کنکشن عارضی طور پر بند کر دیا جائے گا۔\n\n` +
      `اگر آپ بل جمع کروا چکے ہیں تو برائے مہربانی رسید شیئر کریں۔\n\n` +
      `شکریہ!\n` +
      `*خان فائبر نیٹ ورک ٹیم*`;

    openWhatsAppDirect(targetPhone, reminderMessage);
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        
        {/* 1. مختصر ٹاپ ہیڈر */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#1c2541', 
          padding: '10px 14px', 
          borderRadius: '12px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', padding: '6px', borderRadius: '8px', color: '#a78bfa' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#f472b6' }}>
                لسٹ پیمنٹ وصولی (Collection Status)
              </h2>
              <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd' }}>
                Supabase لائیو وصولی، پینڈنگ ریکارڑ اور واٹس ایپ نوٹس
              </p>
            </div>
          </div>
        </div>

        {/* 2. اینالیٹکس کاؤنٹرز (2-Grid Responsive) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          width: '100%'
        }}>
          {/* کل صارفین */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd' }}>کل صارفین</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>{totalUsers} یوزرز</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '6px', color: '#60a5fa' }}>
              <Users size={16} />
            </div>
          </div>

          {/* وصول شدہ یوزرز اور کل وصول رقم */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #10b981', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>کل وصول شدہ ({paidCount} یوزرز)</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>Rs {totals.collectedAmount}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '6px', color: '#34d399' }}>
              <TrendingUp size={16} />
            </div>
          </div>

          {/* پینڈنگ یوزرز اور کل پینڈنگ رقم */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: 'span 1 / -1' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>کل پینڈنگ ({pendingCount} یوزرز)</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>Rs {totals.pendingAmount}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '6px', borderRadius: '6px', color: '#f87171' }}>
              <CreditCard size={16} />
            </div>
          </div>
        </div>

        {/* 3. سوئچر ٹیبز و سرچ بار */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '12px', 
          padding: '12px', 
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* ٹیب سوئچر */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #334155',
            display: 'flex',
            gap: '6px'
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'pending' ? '#991b1b' : 'transparent',
                color: activeTab === 'pending' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Clock size={14} />
              پینڈنگ لسٹ ({pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'paid' ? '#065f46' : 'transparent',
                color: activeTab === 'paid' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={14} />
              وصول لسٹ ({paidCount})
            </button>
          </div>

          {/* سرچ ان پٹ */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text"
                placeholder="نام، PPPoE یوزر نیم یا فون سے سرچ کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  padding: '8px 10px 8px 32px',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '10px', color: '#64748b' }} />
            </div>

            <button 
              onClick={fetchData}
              style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
              ریفریش
            </button>
          </div>
        </div>

        {/* 4. ٹیبل لسٹ */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '12px', 
          padding: '12px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              Supabase سے ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>نام</th>
                  <th style={{ padding: '8px' }}>PPPoE یوزر نیم</th>
                  <th style={{ padding: '8px' }}>فون</th>
                  <th style={{ padding: '8px' }}>ماہانہ بل</th>
                  <th style={{ padding: '8px' }}>جمع شدہ</th>
                  <th style={{ padding: '8px' }}>بقیہ (Remaining)</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>سٹیٹس و ایکشن</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      کوئی ریکارڈ نہیں ملا۔
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((user, index) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                        {user.full_name}
                      </td>
                      <td style={{ padding: '8px', color: '#38bdf8', direction: 'ltr', textAlign: 'right', fontWeight: 'bold' }}>
                        {user.pppoe_username}
                      </td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>
                        {user.phone}
                      </td>
                      <td style={{ padding: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
                        Rs {user.monthly_price}
                      </td>
                      <td style={{ padding: '8px', color: '#34d399', fontWeight: 'bold' }}>
                        Rs {user.last_paid_amount}
                      </td>
                      <td style={{ padding: '8px', color: user.remaining_balance > 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                        Rs {user.remaining_balance}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {user.is_paid ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> وصول شدہ
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> پینڈنگ
                            </span>

                            {/* واٹس ایپ ریمائنڈر بٹن */}
                            <button
                              onClick={() => handleSendReminder(user)}
                              title="واٹس ایپ پر بل نوٹس بھیجیں"
                              style={{
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <MessageSquare size={11} />
                              واٹس ایپ نوٹس
                            </button>
                          </div>
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