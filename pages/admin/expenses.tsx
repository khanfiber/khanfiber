import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  DollarSign, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Calendar, 
  Hash, 
  Tag, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  PieChart
} from 'lucide-react';

interface ExpenseType {
  id: number;
  expense_date: string;
  voucher_no: string;
  category: string;
  description: string;
  amount: number;
  created_at: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // فارم ڈیٹا اسٹیٹ
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucherNo: `EXP-${Math.floor(100 + Math.random() * 900)}`,
    category: 'کیبل و فائبر کا سامان',
    description: '',
    amount: ''
  });

  // 1. Supabase سے تمام اخراجات لوڈ کرنا
  const fetchExpenses = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      setErrorMessage(`ڈیٹا فیچ کرنے میں خرابی: ${error.message}`);
    } else if (data) {
      setExpenses(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. نیا خرچ شامل کرنا
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('براہِ کرم درست رقم درج کریں!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            expense_date: formData.date,
            voucher_no: formData.voucherNo,
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount)
          }
        ]);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSuccess(true);
        // فارم ری سیٹ کریں
        setFormData({
          date: new Date().toISOString().split('T')[0],
          voucherNo: `EXP-${Math.floor(100 + Math.random() * 900)}`,
          category: 'کیبل و فائبر کا سامان',
          description: '',
          amount: ''
        });
        fetchExpenses(); // لسٹ اپ ڈیٹ کریں
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(`خرابی: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. خرچ ڈیلیٹ کرنا
  const handleDelete = async (id: number) => {
    if (confirm('کیا آپ واقعی اس اخراجات کو حذف کرنا چاہتے ہیں؟')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        alert('حذف کرنے میں خرابی: ' + error.message);
      } else {
        fetchExpenses();
      }
    }
  };

  // کل خرچ کا حساب
  const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

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
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px', color: '#f87171' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                روزمرہ اخراجات (Daily Expenses)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                نیٹ ورک کے تمام اخراجات کو درج کریں اور کل کھاتہ چیک کریں
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

        {/* 2. کل خرچ سمری کارڈ */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '16px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#93c5fd', fontWeight: 'bold' }}>کل مجموعی اخراجات (Total Expenses)</p>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#f87171' }}>
              Rs {totalExpense.toLocaleString()}
            </h2>
          </div>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '14px', color: '#f87171' }}>
            <PieChart size={32} />
          </div>
        </div>

        {/* کامیابی کا پیغام */}
        {isSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} />
            اخراجات کامیابی کے ساتھ محفوظ کر دیے گئے ہیں!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            {errorMessage}
          </div>
        )}

        {/* 3. نیا خرچ اینٹری فارم */}
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '24px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            نیا خرچ درج کریں
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            
            {/* تاریخ */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                تاریخ (Date)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }} 
                />
              </div>
            </div>

            {/* نمبر / واؤچر ID */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                واؤچر / نمبر
              </label>
              <input 
                type="text" 
                name="voucherNo" 
                value={formData.voucherNo} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold' }} 
              />
            </div>

            {/* کیٹیگری */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                کیٹیگریز (Categories)
              </label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}
              >
                <option value="کیبل و فائبر کا سامان">کیبل و فائبر کا سامان</option>
                <option value="راؤٹرز و الیکٹرانکس">راؤٹرز و الیکٹرانکس</option>
                <option value="ملازمین کی تنخواہ">ملازمین کی تنخواہ</option>
                <option value="بجلی و ڈیوائسز کا بل">بجلی و ڈیوائسز کا بل</option>
                <option value="دفتر و چائے پانی">دفتر و چائے پانی</option>
                <option value="دیگر متفرق اخراجات">دیگر متفرق اخراجات</option>
              </select>
            </div>

            {/* رقم */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#f87171', marginBottom: '6px' }}>
                رقم (Amount - Rs) *
              </label>
              <input 
                type="number" 
                name="amount" 
                placeholder="مثلاً: 1500"
                value={formData.amount} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ef4444', color: '#f87171', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }} 
              />
            </div>

            {/* تفصیل */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                تفصیل (Description)
              </label>
              <input 
                type="text" 
                name="description" 
                placeholder="خرچ کی مختصر تفصیل لکھیں..."
                value={formData.description} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }} 
              />
            </div>

          </div>

          {/* ایڈ اور سیو بٹن */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '11px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'محفوظ ہو رہا ہے...' : 'خرچ ایڈ و سیو کریں'}
            </button>
          </div>

        </form>

        {/* 4. اخراجات کی فہرست (Expenses Table) */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '20px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
              اخراجات کا مکمل ریکارڈ (Expenses History)
            </h3>
            <button 
              onClick={fetchExpenses}
              style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} /> ریفریش
            </button>
          </div>

          {fetching ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#38bdf8' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>تاریخ</th>
                  <th style={{ padding: '12px' }}>نمبر</th>
                  <th style={{ padding: '12px' }}>کیٹیگری</th>
                  <th style={{ padding: '12px' }}>تفصیل</th>
                  <th style={{ padding: '12px' }}>رقم (Rs)</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ایکشن</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      کوئی اخراجات درج نہیں کیے گئے۔
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp, index) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{exp.expense_date}</td>
                      <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{exp.voucher_no}</td>
                      <td style={{ padding: '12px', color: '#ffffff' }}>
                        <span style={{ backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{exp.description || '---'}</td>
                      <td style={{ padding: '12px', color: '#f87171', fontWeight: 'bold', fontSize: '14px' }}>
                        Rs {exp.amount}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                          title="حذف کریں"
                        >
                          <Trash2 size={14} />
                        </button>
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