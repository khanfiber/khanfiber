import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';
import { 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Loader2
} from 'lucide-react';

interface PaymentType {
  id: number;
  customer_id: number;
  trx_id: string;
  payment_method: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  customers?: {
    full_name: string;
    pppoe_username: string;
    phone: string;
    whatsapp: string;
  };
}

export default function OnlinePaymentsPage() {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 1. Supabase سے آن لائن پیمنٹس لائیو فیچ کریں
  const fetchPayments = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('online_payments')
      .select(`
        *,
        customers (
          full_name,
          pppoe_username,
          phone,
          whatsapp
        )
      `)
      .order('id', { ascending: false });

    if (data) {
      setPayments(data as PaymentType[]);
    }
    if (error) console.error('Fetch online payments error:', error);
    setFetching(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // سرچ فلٹر
  const filteredPayments = payments.filter((p) => {
    const search = searchTerm.toLowerCase();
    const name = p.customers?.full_name?.toLowerCase() || '';
    const username = p.customers?.pppoe_username?.toLowerCase() || '';
    const trx = p.trx_id?.toLowerCase() || '';
    return name.includes(search) || username.includes(search) || trx.includes(search);
  });

  // 2. پیمنٹ کی تصدیق (Approve) + ڈائریکٹ واٹس ایپ رسید
  const handleApprove = async (payment: PaymentType) => {
    if (!confirm(`کیا آپ Rs ${payment.amount} (Trx: ${payment.trx_id}) کی تصدیق کرنا چاہتے ہیں؟`)) return;

    setActionLoading(payment.id);

    try {
      // Step A: پیمنٹ سٹیٹس اپ ڈیٹ کریں
      const { error: payErr } = await supabase
        .from('online_payments')
        .update({ status: 'approved' })
        .eq('id', payment.id);

      if (payErr) throw payErr;

      // Step B: کسٹمر کا موجودہ بقایا چیک کریں
      const { data: colData } = await supabase
        .from('collections')
        .select('remaining_balance')
        .eq('customer_id', payment.customer_id)
        .order('id', { ascending: false })
        .limit(1);

      const prevArrears = colData && colData.length > 0 ? colData[0].remaining_balance : 0;
      const newRemaining = prevArrears - payment.amount;

      // Step C: وصولی کھاتے (collections) میں شامل کریں
      const { error: colErr } = await supabase.from('collections').insert([
        {
          customer_id: payment.customer_id,
          previous_arrears: prevArrears,
          current_bill: 0,
          total_amount: prevArrears,
          paid_amount: payment.amount,
          remaining_balance: newRemaining < 0 ? 0 : newRemaining,
          payment_date: new Date().toISOString()
        }
      ]);

      if (colErr) throw colErr;

      // Step D: کسٹمر کو واٹس ایپ پر ڈائریکٹ منظوری کا میسج بھیجیں
      const targetPhone = payment.customers?.whatsapp || payment.customers?.phone;
      if (targetPhone) {
        const approvedMsg = 
          `*خان فائبر انٹرنیٹ نیٹ ورک*\n` +
          `محترم *${payment.customers?.full_name || ''}*!\n\n` +
          `✅ *آپ کی آن لائن پیمنٹ کی تصدیق ہو چکی ہے*\n` +
          `▫️ طریقہ ادائیگی: ${payment.payment_method}\n` +
          `▫️ Trx ID: ${payment.trx_id}\n` +
          `▫️ منظور شدہ رقم: Rs ${payment.amount}\n` +
          `🔻 بقیہ واجب الادا: Rs ${newRemaining < 0 ? 0 : newRemaining}\n\n` +
          `انٹرنیٹ بل ادا کرنے کا شکریہ!\n` +
          `*خان فائبر نیٹ ورک ٹیم*`;

        openWhatsAppDirect(targetPhone, approvedMsg);
      }

      fetchPayments();
    } catch (err: any) {
      alert('خرابی: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. پیمنٹ منسوخ (Reject) کرنا + ڈائریکٹ واٹس ایپ پیغام
  const handleReject = async (payment: PaymentType) => {
    if (!confirm('کیا آپ اس پیمنٹ کی درخواست کو منسوخ کرنا چاہتے ہیں؟')) return;

    setActionLoading(payment.id);

    try {
      const { error } = await supabase
        .from('online_payments')
        .update({ status: 'rejected' })
        .eq('id', payment.id);

      if (error) throw error;

      // کسٹمر کو واٹس ایپ پر ڈائریکٹ منسوخی کا میسج بھیجیں
      const targetPhone = payment.customers?.whatsapp || payment.customers?.phone;
      if (targetPhone) {
        const rejectedMsg = 
          `*خان فائبر انٹرنیٹ نیٹ ورک*\n` +
          `محترم *${payment.customers?.full_name || ''}*!\n\n` +
          `❌ *آپ کی آن لائن پیمنٹ منسوخ کر دی گئی ہے*\n` +
          `▫️ Trx ID: ${payment.trx_id}\n` +
          `▫️ رقم: Rs ${payment.amount}\n\n` +
          `براہِ کرم اپنی ٹرانزیکشن آئی ڈی یا رسید دوبارہ چیک کر کے بھیجیں یا ایڈمن سے رابطہ کریں۔\n` +
          `شکریہ! *خان فائبر نیٹ ورک ٹیم*`;

        openWhatsAppDirect(targetPhone, rejectedMsg);
      }

      fetchPayments();
    } catch (err: any) {
      alert('منسوخ کرنے میں خرابی: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        
        {/* 1. ٹاپ بار */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#1c2541', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
              <Globe size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                آن لائن پیمنٹ ویریفیکیشن (Online Payments)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                ٹرانزیکشن آئی ڈی چیک کریں، تصدیق یا منسوخی پر واٹس ایپ الرٹ بھیجیں
              </p>
            </div>
          </div>
        </div>

        {/* 2. سرچ اور ریفریش بار */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '12px', 
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input 
              type="text"
              placeholder="نام، یوزر نیم یا Trx ID سے سرچ کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                padding: '8px 10px 8px 34px',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '10px', color: '#64748b' }} />
          </div>

          <button 
            onClick={fetchPayments}
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '8px 14px',
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
            ریفریش کریں
          </button>
        </div>

        {/* 3. آن لائن پیمنٹس ٹیبل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '14px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>صارف</th>
                  <th style={{ padding: '8px' }}>طریقہ ادائیگی</th>
                  <th style={{ padding: '8px' }}>ٹرانزیکشن آئی ڈی (Trx ID)</th>
                  <th style={{ padding: '8px' }}>رقم (Rs)</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>سٹیٹس</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>اقدامات (Action)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      کوئی آن لائن پیمنٹ درخواست موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay, index) => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                        <div>{pay.customers?.full_name || 'نامعلوم'}</div>
                        <div style={{ fontSize: '10px', color: '#38bdf8', direction: 'ltr', textAlign: 'right' }}>
                          {pay.customers?.pppoe_username}
                        </div>
                      </td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>
                        <span style={{ backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', fontSize: '11px' }}>
                          {pay.payment_method || 'Easypaisa / JazzCash'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#f472b6', fontWeight: 'bold', direction: 'ltr', textAlign: 'right' }}>
                        {pay.trx_id}
                      </td>
                      <td style={{ padding: '8px', color: '#34d399', fontWeight: 'bold' }}>
                        Rs {pay.amount}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {pay.status === 'pending' && (
                          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} /> زیرِ التوا
                          </span>
                        )}
                        {pay.status === 'approved' && (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} /> منظور شدہ
                          </span>
                        )}
                        {pay.status === 'rejected' && (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <XCircle size={10} /> منسوخ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {pay.status === 'pending' ? (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button 
                              onClick={() => handleApprove(pay)}
                              disabled={actionLoading === pay.id}
                              style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              {actionLoading === pay.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              تصدیق کریں
                            </button>
                            <button 
                              onClick={() => handleReject(pay)}
                              disabled={actionLoading === pay.id}
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <XCircle size={12} /> منسوخ
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#64748b' }}>مکمل ہو گیا</span>
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