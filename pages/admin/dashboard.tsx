import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Receipt, 
  Globe, 
  FileText, 
  DollarSign, 
  PieChart, 
  UserPlus, 
  Package, 
  Activity, 
  Settings,
  Wrench,
  CreditCard,
  TrendingUp,
  List,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    totalExpenses: 0,
    pendingOnlinePayments: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  // Supabase سے تمام شمار اور ریکویسٹس کی تعداد فیچ کرنا
  const fetchDashboardStats = async () => {
    try {
      // 1. کل یوزرز
      const { count: usersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // 2. وصولی اور پینڈنگ رقم
      const { data: colData } = await supabase
        .from('collections')
        .select('paid_amount, remaining_balance');

      let totalPaid = 0;
      let totalPending = 0;
      if (colData) {
        colData.forEach(item => {
          totalPaid += Number(item.paid_amount || 0);
          totalPending += Number(item.remaining_balance || 0);
        });
      }

      // 3. کل اخراجات
      const { data: expData } = await supabase
        .from('expenses')
        .select('amount');

      let totalExp = 0;
      if (expData) {
        expData.forEach(item => {
          totalExp += Number(item.amount || 0);
        });
      }

      // 4. زیرِ التوا آن لائن پیمنٹس کی تعداد (Pending Online Payments)
      const { count: pendingPayCount } = await supabase
        .from('online_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 5. زیرِ التوا شکایات کی تعداد (Pending Complaints)
      const { count: pendingCompCount } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved');

      setStats({
        totalUsers: usersCount || 0,
        collectedAmount: totalPaid,
        pendingAmount: totalPending,
        totalExpenses: totalExp,
        pendingOnlinePayments: pendingPayCount || 0,
        pendingComplaints: pendingCompCount || 0
      });
    } catch (err) {
      console.error('Dashboard Stats Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* 1. ٹاپ اینالیٹکس کاؤنٹرز (4 Stats Overview) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          width: '100%'
        }}>
          
          {/* کل صارفین */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd', fontWeight: 'bold' }}>کل صارفین</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{loading ? '...' : stats.totalUsers}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px', color: '#60a5fa' }}>
              <Users size={18} />
            </div>
          </div>

          {/* کل وصولی */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #10b981', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd', fontWeight: 'bold' }}>کل وصول شدہ بل</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>Rs {loading ? '...' : stats.collectedAmount.toLocaleString()}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', color: '#34d399' }}>
              <TrendingUp size={18} />
            </div>
          </div>

          {/* بقیہ پینڈنگ */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #f59e0b', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd', fontWeight: 'bold' }}>پینڈنگ واجبات</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>Rs {loading ? '...' : stats.pendingAmount.toLocaleString()}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '8px', color: '#fbbf24' }}>
              <CreditCard size={18} />
            </div>
          </div>

          {/* کل اخراجات */}
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd', fontWeight: 'bold' }}>کل اخراجات</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>Rs {loading ? '...' : stats.totalExpenses.toLocaleString()}</h3>
            </div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '8px', color: '#f87171' }}>
              <DollarSign size={18} />
            </div>
          </div>

        </div>

        {/* ================= 2. اکاؤنٹ سیکشن (Account Section) ================= */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '14px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            <span style={{ backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
              Account Section
            </span>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>
              مالیات و بلنگ کھاتہ جات
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px',
            width: '100%'
          }}>

            {/* 1. بل وصولی */}
            <Link href="/admin/bill-collection" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', color: '#34d399' }}>
                  <Receipt size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>بل وصولی</span>
              </div>
            </Link>

            {/* 2. آن لائن پیمنٹ (ریکویسٹ کاؤنٹر کے ساتھ) */}
            <Link href="/admin/online-payments" style={{ textDecoration: 'none', position: 'relative' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                {stats.pendingOnlinePayments > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '1px solid #fff' }}>
                    {stats.pendingOnlinePayments}
                  </span>
                )}
                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '8px', borderRadius: '8px', color: '#22d3ee' }}>
                  <Globe size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>آن لائن پیمنٹ</span>
              </div>
            </Link>

            {/* 3. بل مینجمنٹ */}
            <Link href="/admin/bill-management" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px', color: '#60a5fa' }}>
                  <List size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>بل مینجمنٹ</span>
              </div>
            </Link>

            {/* 4. وصولی لسٹ */}
            <Link href="/admin/collection-list" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', padding: '8px', borderRadius: '8px', color: '#a78bfa' }}>
                  <FileText size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>وصولی لسٹ</span>
              </div>
            </Link>

            {/* 5. روزمرہ اخراجات */}
            <Link href="/admin/expenses" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '8px', color: '#f87171' }}>
                  <DollarSign size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>روزمرہ اخراجات</span>
              </div>
            </Link>

            {/* 6. خرچ رپورٹ */}
            <Link href="/admin/expense-report" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '8px', color: '#fbbf24' }}>
                  <PieChart size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>خرچ رپورٹ</span>
              </div>
            </Link>

          </div>
        </div>

        {/* ================= 3. ایڈمن سیکشن (Admin Section) ================= */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '14px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            <span style={{ backgroundColor: '#ec4899', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
              Admin Section
            </span>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#f472b6' }}>
              صارفین و نیٹ ورک کنٹرول پینل
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px',
            width: '100%'
          }}>

            {/* 1. نیا کنکشن */}
            <Link href="/admin/new-connection" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
                  <UserPlus size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>نیا کنکشن</span>
              </div>
            </Link>

            {/* 2. یوزر لسٹ */}
            <Link href="/admin/user-list" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', color: '#34d399' }}>
                  <Users size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>یوزر لسٹ</span>
              </div>
            </Link>

            {/* 3. پیکجز سیٹ اپ */}
            <Link href="/admin/packages" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', padding: '8px', borderRadius: '8px', color: '#f472b6' }}>
                  <Package size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>پیکجز سیٹ اپ</span>
              </div>
            </Link>

            {/* 4. کیبل و شکایت (پینڈنگ شکایت کاؤنٹر کے ساتھ) */}
            <Link href="/admin/complaints" style={{ textDecoration: 'none', position: 'relative' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                {stats.pendingComplaints > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '1px solid #fff' }}>
                    {stats.pendingComplaints}
                  </span>
                )}
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '8px', color: '#fbbf24' }}>
                  <Wrench size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>کیبل و شکایت</span>
              </div>
            </Link>

            {/* 5. مائیکروٹک کنفیگ */}
            <Link href="/admin/mikrotik-config" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '8px', borderRadius: '8px', color: '#22d3ee' }}>
                  <Settings size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>مائیکروٹک کنفیگ</span>
              </div>
            </Link>

            {/* 6. کنکشن سگنل چیک */}
            <Link href="/admin/connection-check" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #10b981', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', color: '#34d399' }}>
                  <Activity size={18} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}>سگنل چیک</span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </Layout>
  );
}