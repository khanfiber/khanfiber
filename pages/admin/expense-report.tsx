import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  PieChart, 
  ArrowRight, 
  Calendar, 
  Filter, 
  Printer, 
  DollarSign, 
  RefreshCw,
  FileText,
  Tag
} from 'lucide-react';

interface ExpenseType {
  id: number;
  expense_date: string;
  voucher_no: string;
  category: string;
  description: string;
  amount: number;
}

export default function ExpenseReportPage() {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [fetching, setFetching] = useState(false);

  // تاریخ فلٹرز اسٹیٹ (ڈیفالٹ: رواں ماہ کا پہلا دن اور آج کی تاریخ)
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Supabase سے تاریخ کی بنیاد پر اخراجات فیچ کرنا
  const fetchReportData = async () => {
    setFetching(true);
    let query = supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (selectedCategory !== 'ALL') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (data) {
      setExpenses(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // مجموعی رقم اور کیٹیگری وائز بریک ڈاؤن کا حساب
  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const categoryTotals = expenses.reduce((acc: { [key: string]: number }, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.amount || 0);
    return acc;
  }, {});

  // پرنٹ فنکشن
  const handlePrint = () => {
    window.print();
  };

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
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px', color: '#fbbf24' }}>
              <PieChart size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                خرچ رپورٹ (Expense Report by Date)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                مخصوص تاریخ کی مدت کے مطابق اخراجات کی تفصیل اور رپورٹ
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

        {/* 2. تاریخ اور کیٹیگری فلٹر پینل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '20px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} />
            تاریخ سے تاریخ تک فلٹر منتخب کریں
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            
            {/* تاریخ سے (From Date) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                تاریخ سے (From Date)
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }} 
              />
            </div>

            {/* تاریخ تک (To Date) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                تاریخ تک (To Date)
              </label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }} 
              />
            </div>

            {/* کیٹیگری فلٹر */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                کیٹیگری
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}
              >
                <option value="ALL">تمام کیٹیگریز (All Categories)</option>
                <option value="کیبل و فائبر کا سامان">کیبل و فائبر کا سامان</option>
                <option value="راؤٹرز و الیکٹرانکس">راؤٹرز و الیکٹرانکس</option>
                <option value="ملازمین کی تنخواہ">ملازمین کی تنخواہ</option>
                <option value="بجلی و ڈیوائسز کا بل">بجلی و ڈیوائسز کا بل</option>
                <option value="دفتر و چائے پانی">دفتر و چائے پانی</option>
                <option value="دیگر متفرق اخراجات">دیگر متفرق اخراجات</option>
              </select>
            </div>

            {/* بٹنز */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={fetchReportData}
                style={{ flex: 1, backgroundColor: '#3b82f6', color: '#ffffff', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
                رپورٹ دیکھیں
              </button>

              <button 
                onClick={handlePrint}
                style={{ backgroundColor: '#334155', color: '#38bdf8', padding: '11px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />
                پرنٹ
              </button>
            </div>

          </div>
        </div>

        {/* 3. رپورٹ سمری اور کیٹیگری وائز بریک ڈاؤن */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          {/* منتخب مدت کا کل خرچ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '16px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>
                منتخب شدہ مدت کا کل خرچ ({startDate} سے {endDate})
              </p>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#f87171' }}>
                Rs {totalAmount.toLocaleString()}
              </h2>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '14px', color: '#f87171' }}>
              <DollarSign size={28} />
            </div>
          </div>

          {/* کیٹیگری وائز خلاصہ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px 20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#f472b6', fontWeight: 'bold' }}>
              📊 کیٹیگری وائز ٹوٹل رقم:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '100px', overflowY: 'auto', fontSize: '12px' }}>
              {Object.keys(categoryTotals).length === 0 ? (
                <span style={{ color: '#64748b' }}>کوئی خرچ موجود نہیں</span>
              ) : (
                Object.entries(categoryTotals).map(([cat, amt]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>• {cat}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Rs {amt.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 4. اخراجات کی تفصیلی رپورٹ ٹیبل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '20px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflowX: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            تاریخی خرچ رپورٹ ({startDate} تا {endDate})
          </h3>

          {fetching ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#38bdf8' }}>
              رپورٹ تیار ہو رہی ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>تاریخ</th>
                  <th style={{ padding: '12px' }}>واؤچر / نمبر</th>
                  <th style={{ padding: '12px' }}>کیٹیگری</th>
                  <th style={{ padding: '12px' }}>تفصیل</th>
                  <th style={{ padding: '12px' }}>رقم (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      اس تاریخ کی مدت میں کوئی خرچ موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp, index) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{exp.expense_date}</td>
                      <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{exp.voucher_no || '---'}</td>
                      <td style={{ padding: '12px', color: '#ffffff' }}>
                        <span style={{ backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{exp.description || '---'}</td>
                      <td style={{ padding: '12px', color: '#f87171', fontWeight: 'bold', fontSize: '14px' }}>
                        Rs {exp.amount}
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