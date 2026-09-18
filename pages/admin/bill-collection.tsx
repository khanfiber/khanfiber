import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';
import { 
  Receipt, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
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
  
  const [previousArrears, setPreviousArrears] = useState<number>(0);
  const [currentBill, setCurrentBill] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Supabase سے کسٹمرز لوڈ کریں
  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await supabase.from('customers').select('*');
      if (data) setCustomers(data);
    };
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.pppoe_username && c.pppoe_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCustomer = async (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.full_name || customer.pppoe_username);
    setCurrentBill(customer.monthly_price || 0);

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

  const totalAmount = previousArrears + currentBill;
  const numericPaid = paidAmount ? parseFloat(paidAmount) : 0;
  const remainingBalance = totalAmount - numericPaid;

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
      // 1. Supabase میں ریکارڑ محفوظ کریں
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

        // 2. ڈائریکٹ واٹس ایپ کھولیں
        const targetPhone = selectedCustomer.whatsapp || selectedCustomer.phone;
        
        if (targetPhone) {
          const whatsappMsg = 
            `*خان فائبر انٹرنیٹ نیٹ ورک - بل رسید*\n\n` +
            `محترم *${selectedCustomer.full_name}*!\n` +
            `آپ کی بل وصولی کامیابی سے درج کر لی گئی ہے۔\n\n` +
            `▫️ پچھلا بقایا: Rs ${previousArrears}\n` +
            `▫️ موجودہ بل: Rs ${currentBill}\n` +
            `▫️ کل رقم: Rs ${totalAmount}\n` +
            `✅ *جمع کردہ رقم:* Rs ${numericPaid}\n` +
            `🔻 *بقیہ واجبات:* Rs ${remainingBalance}\n\n` +
            `شکریہ! خان فائبر ٹیم`;

          // واٹس ایپ اوپن کریں
          openWhatsAppDirect(targetPhone, whatsappMsg);
        }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        
        {/* مختصر ٹاپ ہیڈر */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#1c2541', 
          padding: '10px 14px', 
          borderRadius: '12px', 
          border: '1px solid #10b981' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px', color: '#34d399' }}>
              <Receipt size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#f472b6' }}>
                بل وصولی (Bill Collection Panel)
              </h2>
              <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd' }}>
                ماہانہ بل ریکارڑ اور واٹس ایپ رسید بھیجیں
              </p>
            </div>
          </div>
        </div>

        {/* الرٹس */}
        {isSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            بل محفوظ ہو گیا اور واٹس ایپ ونڈو کھول دی گئی ہے!
          </div>
        )}

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* مین فارم */}
        <div style={{ backgroundColor: '#1c2541', borderRadius: '14px', padding: '16px', border: '1px solid #334155' }}>
          
          {/* یوزر تلاش کرنے کا ان پٹ */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
              صارف کا نام یا یوزر نیم سرچ کریں *
            </label>
            <input 
              type="text" 
              placeholder="نام یا PPPoE یوزر نیم..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(null);
              }}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '8px 10px 8px 32px', borderRadius: '8px', fontSize: '12px' }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '28px', color: '#64748b' }} />

            {/* ڈراپ ڈاؤن لسٹ */}
            {searchTerm && !selectedCustomer && filteredCustomers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', marginTop: '4px', zIndex: 20, maxHeight: '180px', overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectCustomer(c)}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                  >
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{c.full_name}</span>
                    <span style={{ color: '#38bdf8', direction: 'ltr' }}>{c.pppoe_username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* حساب کتاب فارم */}
          <form onSubmit={handleSaveBill} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* پچھلا بقایاجات */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#f87171', fontWeight: 'bold', marginBottom: '4px' }}>
                پچھلا بقایاجات (Arrears)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${previousArrears}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ef4444', color: '#f87171', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
              />
            </div>

            {/* موجودہ بل */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>
                موجودہ بل (Monthly Bill)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${currentBill}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
              />
            </div>

            {/* کل رقم */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#f472b6', fontWeight: 'bold', marginBottom: '4px' }}>
                کل رقم (Total Amount)
              </label>
              <input 
                type="text" 
                readOnly 
                value={`Rs ${totalAmount}`}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ec4899', color: '#f472b6', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
              />
            </div>

            {/* جمع رقم */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#34d399', fontWeight: 'bold', marginBottom: '4px' }}>
                جمع رقم (Paid Amount) *
              </label>
              <input 
                type="number" 
                placeholder="رقم درج کریں..."
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
              />
            </div>

            {/* بقیہ بقایا */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>بقیہ رقم (Remaining Balance):</span>
                <span style={{ fontSize: '16px', color: remainingBalance > 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                  Rs {remainingBalance}
                </span>
              </div>
            </div>

            {/* سبمٹ بٹن */}
            <div style={{ gridColumn: 'span 1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'محفوظ ہو رہا ہے...' : 'بل محفوظ کریں اور رسید بھیجیں'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </Layout>
  );
}