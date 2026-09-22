import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
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
  const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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
          border: '1px solid #ef4444' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '10px', color: '#f87171' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                روزمرہ اخراجات (Daily Expenses)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                نیٹ ورک کے تمام اخراجات کو درج کریں اور کل کھاتہ چیک کریں
              </p>
            </div>
          </div>
        </div>

        {/* 2. کل خرچ سمری کارڈ */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>کل مجموعی اخراجات (Total Expenses)</p>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#f87171' }}>
              Rs {totalExpense.toLocaleString()}
            </h2>
          </div>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', color: '#f87171' }}>
            <PieChart size={26} />
          </div>
        </div>

        {/* کامیابی کا پیغام */}
        {isSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            اخراجات کامیابی کے ساتھ محفوظ کر دیے گئے ہیں!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* 3. نیا خرچ اینٹری فارم */}
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '16px', 
          border: '1px solid #334155'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            نیا خرچ درج کریں
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* تاریخ */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                تاریخ (Date)
              </label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
              />
            </div>

            {/* نمبر / واؤچر ID */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                واؤچر / نمبر
              </label>
              <input 
                type="text" 
                name="voucherNo" 
                value={formData.voucherNo} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
              />
            </div>

            {/* کیٹیگری */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                کیٹیگریز (Categories)
              </label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>
                رقم (Amount - Rs) *
              </label>
              <input 
                type="number" 
                name="amount" 
                placeholder="مثلاً: 1500"
                value={formData.amount} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ef4444', color: '#f87171', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }} 
              />
            </div>

            {/* تفصیل */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                تفصیل (Description)
              </label>
              <input 
                type="text" 
                name="description" 
                placeholder="خرچ کی مختصر تفصیل لکھیں..."
                value={formData.description} 
                onChange={handleChange}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
              />
            </div>

          </div>

          {/* ایڈ اور سیو بٹن */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? 'محفوظ ہو رہا ہے...' : 'خرچ ایڈ و سیو کریں'}
            </button>
          </div>

        </form>

        {/* 4. اخراجات کی فہرست (Expenses Table) */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '14px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#f472b6' }}>
              اخراجات کا مکمل ریکارڈ (Expenses History)
            </h3>
            <button 
              onClick={fetchExpenses}
              style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} /> ریفریش
            </button>
          </div>

          {fetching ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>تاریخ</th>
                  <th style={{ padding: '8px' }}>نمبر</th>
                  <th style={{ padding: '8px' }}>کیٹیگری</th>
                  <th style={{ padding: '8px' }}>تفصیل</th>
                  <th style={{ padding: '8px' }}>رقم (Rs)</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>ایکشن</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      کوئی اخراجات درج نہیں کیے گئے۔
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp, index) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>{exp.expense_date}</td>
                      <td style={{ padding: '8px', color: '#38bdf8', fontWeight: 'bold' }}>{exp.voucher_no}</td>
                      <td style={{ padding: '8px', color: '#ffffff' }}>
                        <span style={{ backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', fontSize: '11px' }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{exp.description || '---'}</td>
                      <td style={{ padding: '8px', color: '#f87171', fontWeight: 'bold' }}>
                        Rs {exp.amount}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                          title="حذف کریں"
                        >
                          <Trash2 size={12} />
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