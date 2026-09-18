import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  Receipt, 
  ArrowRight, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Send
} from 'lucide-react';

interface CustomerType {
  id: number;
  full_name: string;
  pppoe_username: string;
  phone: string;
  whatsapp: string;
  monthly_price: number;
}

export default function BillCollection() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  
  // بلنگ حساب کتاب اسٹیٹ
  const [previousArrears, setPreviousArrears] = useState<number>(0); // پچھلا بقایا
  const [currentBill, setCurrentBill] = useState<number>(0);       // موجودہ بل
  const [paidAmount, setPaidAmount] = useState<string>('');          // جمع رقم
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Supabase سے کسٹمرز لوڈ کریں
  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await supabase.from('customers').select('*');
      if (data) setCustomers(data);
    };
    loadCustomers();
  }, []);

  // سرچ فلٹر
  const filteredCustomers = customers.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.pppoe_username && c.pppoe_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // یوزر منتخب ہونے پر بل سیٹ کریں
  const handleSelectCustomer = async (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.full_name || customer.pppoe_username);
    setCurrentBill(customer.monthly_price || 0);

    // Supabase سے پچھلا بقایاجات چیک کریں
    const { data } = await supabase
      .from('collections')
      .select('remaining_balance')
      .eq('customer_id', customer.id)
      .order('id', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPreviousArrears(data[0].remaining_balance || 0);
    } else {
      setPreviousArrears(0);
    }
  };

  // کل رقم (پچھلا بقایا + موجودہ بل)
  const totalAmount = previousArrears + currentBill;
  
  // بقایا رقم (کل رقم - جمع کی گئی رقم)
  const numericPaid = paidAmount ? parseFloat(paidAmount) : 0;
  const remainingBalance = totalAmount - numericPaid;

  // 2. بل سیو اور Baileys API سے آٹو واٹس ایپ میسج
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMessage('براہِ کرم پہلے کسی صارف کا انتخاب کریں!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      // Step A: Supabase میں بل ہسٹری محفوظ کریں
      const { error } = await supabase.from('collections').insert([
        {
          customer_id: selectedCustomer.id,
          previous_arrears: previousArrears,
          current_bill: currentBill,
          total_amount: totalAmount,
          paid_amount: numericPaid,
          remaining_balance: remainingBalance,
          payment_date: new Date().toISOString()
        }
      ]);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSuccess(true);

        // Step B: Baileys Node.js API کو کال کر کے بیک اینڈ سے آٹو واٹس ایپ میسج بھیجیں
        const targetPhone = selectedCustomer.whatsapp || selectedCustomer.phone;
        
        if (targetPhone) {
          const whatsappMsg = 
            `*خان فائبر انٹرنیٹ نیٹ ورک*\n` +
            `محترم ${selectedCustomer.full_name}!\n` +
            `آپ کا انٹرنیٹ بل کامیابی سے موصول ہو گیا ہے۔\n\n` +
            `▫️ پچھلا بقایا: Rs ${previousArrears}\n` +
            `▫️ موجودہ بل: Rs ${currentBill}\n` +
            `▫️ کل رقم: Rs ${totalAmount}\n` +
            `✅ *جمع شدہ رقم:* Rs ${numericPaid}\n` +
            `🔻 *بقیہ واجب الادا:* Rs ${remainingBalance}\n\n` +
            `شکریہ! سقاء سوفٹویئر سروسز`;

          try {
            await fetch('/api/send-whatsapp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: targetPhone,
                message: whatsappMsg
              })
            });
          } catch (waErr) {
            console.error('WhatsApp Background API Error:', waErr);
          }
        }

        // فارم ری سیٹ کریں
        setPaidAmount('');
        setTimeout(() => setIsSuccess(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(`خرابی پیش آئی: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* ٹاپ بار: نیویگیشن اور عنوان */}
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
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px', color: '#34d399' }}>
              <Receipt size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                بل وصولی (Bill Collection Panel)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                ماہانہ بل وصول کریں اور واٹس ایپ پر خودکار رسید بھیجیں
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

        {/* کامیابی کا پیغام */}
        {isSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} />
            بل کامیابی سے محفوظ ہو گیا ہے اور بیک اینڈ سے خودکار واٹس ایپ پیغام بھیج دیا گیا ہے!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            {errorMessage}
          </div>
        )}

        {/* مین بلنگ فارم */}
        <div style={{ backgroundColor: '#1c2541', borderRadius: '20px', padding: '24px', border: '1px solid #334155', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          
          {/* 1. یوزر تلاش کرنے کا باکس */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>
              صارف کا نام یا یوزر نیم سرچ کریں *
            </label>
            <input 
              type="text" 
              placeholder="نام یا PPPoE یوزر نیم لکھیں..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(null);
              }}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '10px 12px 10px 36px', borderRadius: '10px', fontSize: '13px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '34px', color: '#64748b' }} />

            {/* سرچ رزلٹس ڈراپ ڈاؤن */}
            {searchTerm && !selectedCustomer && filteredCustomers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', marginTop: '4px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectCustomer(c)}
                    style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                  >
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{c.full_name}</span>
                    <span style={{ color: '#38bdf8', direction: 'ltr' }}>{c.pppoe_username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. بل کا حساب کتاب (Calculations Table) */}
          <form onSubmit={handleSaveBill} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            
            {/* پچھلا بقایاجات */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#f87171', fontWeight: 'bold', marginBottom: '6px' }}>
                پچھلا بقایاجات (Arrears)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${previousArrears}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ef4444', color: '#f87171', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>

            {/* موجودہ بل */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>
                موجودہ بل (Monthly Bill)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${currentBill}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>

            {/* کل رقم */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#f472b6', fontWeight: 'bold', marginBottom: '6px' }}>
                کل رقم (Total Amount)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${totalAmount}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ec4899', color: '#f472b6', padding: '10px 12px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold' }}
              />
            </div>

            {/* جمع رقم (Input) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                جمع رقم (Paid Amount) *
              </label>
              <input 
                type="number" 
                placeholder="رقم درج کریں..."
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '10px 12px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold' }}
              />
            </div>

            {/* بقایا رقم ڈسپلے */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '14px 20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 'bold' }}>بقیہ بقایا رقم (Remaining Balance):</span>
                <span style={{ fontSize: '20px', color: remainingBalance > 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                  Rs {remainingBalance}
                </span>
              </div>
            </div>

            {/* سبمٹ بٹن */}
            <div style={{ gridColumn: 'span 1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {loading ? 'محفوظ ہو رہا ہے...' : 'بل محفوظ کریں اور خودکار واٹس ایپ بھیجیں'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </Layout>
  );
}