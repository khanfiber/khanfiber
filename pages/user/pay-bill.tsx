import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  CreditCard, 
  Send, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building, 
  Smartphone, 
  QrCode,
  DollarSign
} from 'lucide-react';

interface CustomerType {
  id: number;
  full_name: string;
  pppoe_username: string;
  monthly_price: number;
}

export default function PayBillPage() {
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [billingStats, setBillingStats] = useState({
    monthlyBill: 0,
    previousArrears: 0,
    totalDue: 0,
    totalPaid: 0
  });

  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'raast' | 'bank'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. کسٹمر کے حسابات فیچ کریں
  useEffect(() => {
    const loadBillingData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const customerId = parsedUser.id || parsedUser.customer_id;

      // کسٹمر کا ڈیٹا
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      // وصولیوں کی ہسٹری
      const { data: collections } = await supabase
        .from('collections')
        .select('paid_amount, remaining_balance')
        .eq('customer_id', customerId);

      let paidSum = 0;
      let lastRemaining = 0;

      if (collections && collections.length > 0) {
        collections.forEach(c => {
          paidSum += Number(c.paid_amount || 0);
        });
        lastRemaining = Number(collections[collections.length - 1].remaining_balance || 0);
      } else {
        lastRemaining = Number(custData?.connection_charges || 0);
      }

      const monthly = Number(custData?.monthly_price || 0);
      const total = monthly + lastRemaining;

      if (custData) setCustomer(custData);
      setBillingStats({
        monthlyBill: monthly,
        previousArrears: lastRemaining,
        totalDue: total,
        totalPaid: paidSum
      });
      setAmountPaid(String(total));
    };

    loadBillingData();
  }, []);

  // 2. تصویر کو 10 KB تک کمپریس (Compress) کرنے کا فنکشن
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // سائز چھوٹا کریں (حجم کم کرنے کے لیے)
        const maxWidth = 400;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // کوالٹی کم کر کے 10 KB تک لائیں
        let quality = 0.5;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // مزید کمپریس کریں اگر سائز بڑا ہو
        while (compressedDataUrl.length > 15000 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setReceiptBase64(compressedDataUrl);
        setReceiptImage(file);
        setCompressing(false);
      };
    };
  };

  // 3. آن لائن پیمنٹ ریکویسٹ سبمٹ کریں
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!transactionId && !receiptBase64) {
      setErrorMsg('براہِ کرم ٹرانزیکشن آئی ڈی درج کریں یا رسید کی تصویر اپ لوڈ کریں!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('online_payments')
        .insert([
          {
            customer_id: customer.id,
            amount: parseFloat(amountPaid) || 0,
            payment_method: paymentMethod,
            transaction_id: transactionId || 'N/A',
            receipt_url: receiptBase64 || null,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setSuccessMsg('آپ کی آن لائن پیمنٹ کی ریکویسٹ کامیابی کے ساتھ پروسیسنگ کے لیے ایڈمن کو بھیج دی گئی ہے!');
      setTransactionId('');
      setReceiptBase64('');
      setReceiptImage(null);
    } catch (err: any) {
      setErrorMsg('پیمنٹ بھیجنے میں خرابی پیش آئی: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #10b981', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34d399' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#34d399', fontWeight: 'bold' }}>آن لائن بل ادائیگی (Pay Bill)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنے بل کی آن لائن ادائیگی کریں اور رسید بھیجیں</p>
          </div>
        </div>

        {/* 1. واجبات کا حساب (Bill Breakdown) */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            📊 واجبات و بل تفصیلات
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>ماہانہ بل</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#38bdf8' }}>Rs {billingStats.monthlyBill}</h4>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>سابقہ بقایاجات</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#fbbf24' }}>Rs {billingStats.previousArrears}</h4>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>کل واجب الادا رقم</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#f87171', fontWeight: 'bold' }}>Rs {billingStats.totalDue}</h4>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #10b981' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>تک کل جمع شدہ</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#34d399' }}>Rs {billingStats.totalPaid}</h4>
            </div>
          </div>
        </div>

        {/* پیغامات */}
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* 2. ادائیگی کا فارم */}
        <form onSubmit={handleSubmitPayment} style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <h3 style={{ margin: 0, fontSize: '13px', color: '#38bdf8' }}>💳 آن لائن طریقہ منتخب کریں:</h3>

          {/* پیمنٹ طریقے (Radio Options) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            
            <div 
              onClick={() => setPaymentMethod('easypaisa')}
              style={{ backgroundColor: paymentMethod === 'easypaisa' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a', border: `1px solid ${paymentMethod === 'easypaisa' ? '#10b981' : '#334155'}`, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Smartphone size={18} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>ایزی پیسہ</span>
            </div>

            <div 
              onClick={() => setPaymentMethod('jazzcash')}
              style={{ backgroundColor: paymentMethod === 'jazzcash' ? 'rgba(239, 68, 68, 0.2)' : '#0f172a', border: `1px solid ${paymentMethod === 'jazzcash' ? '#ef4444' : '#334155'}`, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Smartphone size={18} style={{ color: '#f87171' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>جاز کیش</span>
            </div>

            <div 
              onClick={() => setPaymentMethod('raast')}
              style={{ backgroundColor: paymentMethod === 'raast' ? 'rgba(245, 158, 11, 0.2)' : '#0f172a', border: `1px solid ${paymentMethod === 'raast' ? '#f59e0b' : '#334155'}`, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <QrCode size={18} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>راست آئی ڈی</span>
            </div>

            <div 
              onClick={() => setPaymentMethod('bank')}
              style={{ backgroundColor: paymentMethod === 'bank' ? 'rgba(59, 130, 246, 0.2)' : '#0f172a', border: `1px solid ${paymentMethod === 'bank' ? '#3b82f6' : '#334155'}`, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Building size={18} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>بینک اکاؤنٹ</span>
            </div>

          </div>

          {/* اکاؤنٹ نمبر نوٹس */}
          <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8', fontSize: '11px', color: '#93c5fd' }}>
            💡 <strong>نوٹ:</strong> رقم اکاؤنٹ نمبر <strong>0300-1234567</strong> (خان فائبر نیٹ ورک) پر بھیجیں اور نیچے TRX ID یا رسید اپ لوڈ کریں۔
          </div>

          {/* ادا کی گئی رقم */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#38bdf8', marginBottom: '4px', fontWeight: 'bold' }}>جمع کی جانے والی رقم (Rs) *</label>
            <input 
              type="number" 
              value={amountPaid} 
              onChange={(e) => setAmountPaid(e.target.value)} 
              required 
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#fff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
            />
          </div>

          {/* ٹرانزیکشن آئی ڈی */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>ٹرانزیکشن آئی ڈی (TRX ID)</label>
            <input 
              type="text" 
              placeholder="مثلاً: 9876543210" 
              value={transactionId} 
              onChange={(e) => setTransactionId(e.target.value)} 
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', direction: 'ltr' }} 
            />
          </div>

          {/* رسید اپ لوڈ کریں (خودکار 10 KB کمپریشن) */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>رسید کی تصویر اپ لوڈ کریں (Auto Compress ~10KB)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
                id="receipt-upload" 
              />
              <label htmlFor="receipt-upload" style={{ backgroundColor: '#0f172a', border: '1px dashed #3b82f6', color: '#38bdf8', padding: '10px', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                <Upload size={14} />
                {compressing ? 'تصویر کمپریس ہو رہی ہے...' : receiptImage ? `منتخب شدہ: ${receiptImage.name}` : 'تصویر منتخب کریں'}
              </label>
            </div>
            {receiptBase64 && (
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#34d399' }}>✅ تصویر کامیابی سے کمپریس کر لی گئی ہے!</p>
            )}
          </div>

          {/* سبمٹ بٹن */}
          <button 
            type="submit" 
            disabled={loading || compressing} 
            style={{ backgroundColor: '#10b981', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'ریکویسٹ بھیجی جا رہی ہے...' : 'پیمنٹ ریکویسٹ ایڈمن کو بھیجیں'}
          </button>

        </form>

      </div>
    </Layout>
  );
}