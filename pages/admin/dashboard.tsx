import React, { useEffect, useState } from 'react';
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
  BarChart3,
  WalletCards,
  Loader2,
  RefreshCw
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface DashboardStats {
  totalUsers: number;
  collectedAmount: number;
  pendingAmount: number;
  totalExpenses: number;
  pendingOnlinePayments: number;
  pendingComplaints: number;
  paidUsers: number;
  pendingUsers: number;
}

interface CustomerType {
  id: number;
  monthly_price?: number | string | null;
  connection_charges?: number | string | null;
}

interface CollectionType {
  id: number;
  customer_id: number;
  paid_amount?: number | string | null;
  remaining_balance?: number | string | null;
  payment_date?: string | null;
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    totalExpenses: 0,
    pendingOnlinePayments: 0,
    pendingComplaints: 0,
    paidUsers: 0,
    pendingUsers: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /* =========================================================
     DASHBOARD STATS
  ========================================================= */

  const fetchDashboardStats = async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      /* =====================================================
         LOAD EVERYTHING IN PARALLEL
      ===================================================== */

      const [
        customersResult,
        collectionsResult,
        expensesResult,
        onlinePaymentsResult,
        complaintsResult
      ] = await Promise.all([
        /* Customers */
        supabase
          .from('customers')
          .select(
            'id, monthly_price, connection_charges'
          ),

        /* Collections
           Latest record for each customer will be selected below.
        */
        supabase
          .from('collections')
          .select(
            'id, customer_id, paid_amount, remaining_balance, payment_date'
          )
          .order('id', { ascending: false }),

        /* Expenses */
        supabase
          .from('expenses')
          .select('amount'),

        /* Pending Online Payments */
        supabase
          .from('online_payments')
          .select('*', {
            count: 'exact',
            head: true
          })
          .eq('status', 'pending'),

        /* Pending Complaints */
        supabase
          .from('complaints')
          .select('*', {
            count: 'exact',
            head: true
          })
          .neq('status', 'resolved')
      ]);

      /* =====================================================
         ERROR CHECKS
      ===================================================== */

      if (customersResult.error) {
        throw new Error(
          `Customers: ${customersResult.error.message}`
        );
      }

      if (collectionsResult.error) {
        throw new Error(
          `Collections: ${collectionsResult.error.message}`
        );
      }

      if (expensesResult.error) {
        console.error(
          'Expenses Error:',
          expensesResult.error.message
        );
      }

      if (onlinePaymentsResult.error) {
        console.error(
          'Online Payments Error:',
          onlinePaymentsResult.error.message
        );
      }

      if (complaintsResult.error) {
        console.error(
          'Complaints Error:',
          complaintsResult.error.message
        );
      }

      /* =====================================================
         DATA
      ===================================================== */

      const customers: CustomerType[] =
        (customersResult.data || []) as CustomerType[];

      const collections: CollectionType[] =
        (collectionsResult.data || []) as CollectionType[];

      /* =====================================================
         1. TOTAL USERS
      ===================================================== */

      const totalUsers = customers.length;

      /* =====================================================
         2. TOTAL COLLECTED AMOUNT

         یہاں تمام actual paid_amount جمع ہوں گے۔
         ایک collection = ایک وصولی transaction۔
      ===================================================== */

      const totalCollected = collections.reduce(
        (sum, collection) => {
          return (
            sum +
            Number(collection.paid_amount || 0)
          );
        },
        0
      );

      /* =====================================================
         3. LATEST COLLECTION PER CUSTOMER

         collections پہلے ID descending ہیں۔

         اس لیے customer کی پہلی ملنے والی row
         اس customer کی latest collection ہوگی۔
      ===================================================== */

      const latestCollectionMap =
        new Map<number, CollectionType>();

      collections.forEach((collection) => {
        const customerId = Number(
          collection.customer_id
        );

        if (
          customerId &&
          !latestCollectionMap.has(customerId)
        ) {
          latestCollectionMap.set(
            customerId,
            collection
          );
        }
      });

      /* =====================================================
         4. REAL CURRENT PENDING AMOUNT

         IMPORTANT FIX:

         پرانا code ہر collection row کا remaining_balance
         جمع کر رہا تھا۔

         اب ہر customer کا صرف CURRENT/LATEST balance
         لیا جائے گا۔

         اگر customer کی ابھی collection نہیں:
         Connection Charges + Monthly Price
      ===================================================== */

      let totalPending = 0;
      let pendingUsers = 0;
      let paidUsers = 0;

      customers.forEach((customer) => {
        const latestCollection =
          latestCollectionMap.get(
            Number(customer.id)
          );

        let currentRemaining = 0;

        if (latestCollection) {
          /* Customer already has billing history */

          currentRemaining = Math.max(
            0,
            Number(
              latestCollection.remaining_balance ||
                0
            )
          );
        } else {
          /* New customer with no collection yet */

          const connectionCharges = Number(
            customer.connection_charges || 0
          );

          const monthlyPrice = Number(
            customer.monthly_price || 0
          );

          currentRemaining =
            connectionCharges + monthlyPrice;
        }

        totalPending += currentRemaining;

        if (currentRemaining > 0) {
          pendingUsers += 1;
        } else {
          paidUsers += 1;
        }
      });

      /* =====================================================
         5. TOTAL EXPENSES
      ===================================================== */

      let totalExpenses = 0;

      if (!expensesResult.error) {
        totalExpenses = (
          expensesResult.data || []
        ).reduce((sum: number, item: any) => {
          return sum + Number(item.amount || 0);
        }, 0);
      }

      /* =====================================================
         6. COUNTERS
      ===================================================== */

      const pendingOnlinePayments =
        onlinePaymentsResult.count || 0;

      const pendingComplaints =
        complaintsResult.count || 0;

      /* =====================================================
         SAVE STATS
      ===================================================== */

      setStats({
        totalUsers,
        collectedAmount: totalCollected,
        pendingAmount: totalPending,
        totalExpenses,
        pendingOnlinePayments,
        pendingComplaints,
        paidUsers,
        pendingUsers
      });
    } catch (err: any) {
      console.error(
        'Dashboard Stats Fetch Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'Dashboard data load نہیں ہو سکا۔'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     FIRST LOAD
  ========================================================= */

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  /* =========================================================
     CARD COMPONENT
  ========================================================= */

  const MenuCard = ({
    href,
    title,
    icon,
    iconColor,
    iconBackground,
    borderColor = '#27445f',
    badge
  }: {
    href: string;
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    iconBackground: string;
    borderColor?: string;
    badge?: number;
  }) => {
    return (
      <Link
        href={href}
        style={{
          textDecoration: 'none',
          position: 'relative',
          display: 'block'
        }}
      >
        <div
          style={{
            minHeight: '92px',
            background:
              'linear-gradient(145deg, #071525 0%, #0a1c2e 100%)',
            border: `1px solid ${borderColor}`,
            borderRadius: '13px',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxSizing: 'border-box',
            boxShadow:
              '0 5px 18px rgba(0,0,0,.10)'
          }}
        >
          {badge !== undefined && badge > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                minWidth: '21px',
                height: '21px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '0 5px',
                borderRadius: '20px',
                border: '2px solid #081525',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                zIndex: 2
              }}
            >
              {badge}
            </span>
          )}

          <div
            style={{
              width: '37px',
              height: '37px',
              backgroundColor: iconBackground,
              borderRadius: '10px',
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </div>

          <span
            style={{
              fontSize: '11px',
              lineHeight: '17px',
              fontWeight: '800',
              color: '#f8fafc'
            }}
          >
            {title}
          </span>
        </div>
      </Link>
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        {/* ===================================================
            DASHBOARD TOP HEADER
        =================================================== */}

        <div
          style={{
            background:
              'linear-gradient(135deg, #081a2c 0%, #0b2035 55%, #09283a 100%)',
            border: '1px solid #164e63',
            borderRadius: '16px',
            padding: '13px 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow:
              '0 8px 30px rgba(0,0,0,.15)'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                color: '#f8fafc',
                fontWeight: '800'
              }}
            >
              ایڈمن ڈیش بورڈ
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                color: '#64748b',
                fontSize: '10px',
                direction: 'ltr'
              }}
            >
              One Click • Haider Fiber Network
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchDashboardStats(true)
            }
            disabled={refreshing}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #164e63',
              background: '#071525',
              color: '#22d3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: refreshing
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {refreshing ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}
          </button>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239,68,68,.10)',
              border:
                '1px solid rgba(239,68,68,.45)',
              color: '#f87171',
              borderRadius: '11px',
              padding: '10px 12px',
              fontSize: '11px'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* ===================================================
            ANALYTICS
        =================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            width: '100%'
          }}
        >
          {/* TOTAL USERS */}

          <div
            style={{
              background:
                'linear-gradient(145deg, #0b1b2e, #0b2034)',
              border: '1px solid #2563eb',
              borderRadius: '13px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '10px',
                  color: '#93c5fd',
                  fontWeight: '700'
                }}
              >
                کل صارفین
              </p>

              <h3
                style={{
                  margin: '3px 0 0',
                  fontSize: '19px',
                  color: '#ffffff'
                }}
              >
                {loading
                  ? '...'
                  : stats.totalUsers.toLocaleString()}
              </h3>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '8px',
                  color: '#64748b'
                }}
              >
                کل رجسٹرڈ کنکشن
              </p>
            </div>

            <div
              style={{
                background:
                  'rgba(59,130,246,.15)',
                padding: '9px',
                borderRadius: '9px',
                color: '#60a5fa'
              }}
            >
              <Users size={19} />
            </div>
          </div>

          {/* TOTAL COLLECTION */}

          <div
            style={{
              background:
                'linear-gradient(145deg, #0b1b2e, #0b2034)',
              border: '1px solid #059669',
              borderRadius: '13px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '10px',
                  color: '#6ee7b7',
                  fontWeight: '700'
                }}
              >
                کل وصول شدہ بل
              </p>

              <h3
                style={{
                  margin: '3px 0 0',
                  fontSize: '18px',
                  color: '#34d399'
                }}
              >
                Rs{' '}
                {loading
                  ? '...'
                  : stats.collectedAmount.toLocaleString()}
              </h3>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '8px',
                  color: '#64748b'
                }}
              >
                تمام وصول شدہ رقوم
              </p>
            </div>

            <div
              style={{
                background:
                  'rgba(16,185,129,.15)',
                padding: '9px',
                borderRadius: '9px',
                color: '#34d399'
              }}
            >
              <TrendingUp size={19} />
            </div>
          </div>

          {/* REAL PENDING AMOUNT */}

          <div
            style={{
              background:
                'linear-gradient(145deg, #0b1b2e, #0b2034)',
              border: '1px solid #d97706',
              borderRadius: '13px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '10px',
                  color: '#fbbf24',
                  fontWeight: '700'
                }}
              >
                کل پینڈنگ وصولی
              </p>

              <h3
                style={{
                  margin: '3px 0 0',
                  fontSize: '18px',
                  color: '#fbbf24'
                }}
              >
                Rs{' '}
                {loading
                  ? '...'
                  : stats.pendingAmount.toLocaleString()}
              </h3>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '8px',
                  color: '#f59e0b'
                }}
              >
                {loading
                  ? '...'
                  : `${stats.pendingUsers} صارفین سے وصولی باقی`}
              </p>
            </div>

            <div
              style={{
                background:
                  'rgba(245,158,11,.15)',
                padding: '9px',
                borderRadius: '9px',
                color: '#fbbf24'
              }}
            >
              <CreditCard size={19} />
            </div>
          </div>

          {/* EXPENSES */}

          <div
            style={{
              background:
                'linear-gradient(145deg, #0b1b2e, #0b2034)',
              border: '1px solid #dc2626',
              borderRadius: '13px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '10px',
                  color: '#fca5a5',
                  fontWeight: '700'
                }}
              >
                کل اخراجات
              </p>

              <h3
                style={{
                  margin: '3px 0 0',
                  fontSize: '18px',
                  color: '#f87171'
                }}
              >
                Rs{' '}
                {loading
                  ? '...'
                  : stats.totalExpenses.toLocaleString()}
              </h3>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '8px',
                  color: '#64748b'
                }}
              >
                تمام ریکارڈ شدہ اخراجات
              </p>
            </div>

            <div
              style={{
                background:
                  'rgba(239,68,68,.15)',
                padding: '9px',
                borderRadius: '9px',
                color: '#f87171'
              }}
            >
              <DollarSign size={19} />
            </div>
          </div>
        </div>

        {/* ===================================================
            ACCOUNT SECTION
        =================================================== */}

        <div
          style={{
            background:
              'linear-gradient(145deg, #0b1b2e, #0b2034)',
            border: '1px solid #183a55',
            borderRadius: '16px',
            padding: '14px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '13px',
              borderBottom: '1px solid #183a55',
              paddingBottom: '9px'
            }}
          >
            <span
              style={{
                background:
                  'linear-gradient(135deg,#2563eb,#0891b2)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '4px 9px',
                borderRadius: '7px',
                direction: 'ltr'
              }}
            >
              Account Section
            </span>

            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: '800',
                color: '#67e8f9'
              }}
            >
              مالیات و بلنگ کھاتہ جات
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(125px, 1fr))',
              gap: '9px'
            }}
          >
            <MenuCard
              href="/admin/bill-collection"
              title="بل وصولی"
              icon={<Receipt size={19} />}
              iconColor="#34d399"
              iconBackground="rgba(16,185,129,.15)"
            />

            <MenuCard
              href="/admin/online-payments"
              title="آن لائن پیمنٹ"
              icon={<Globe size={19} />}
              iconColor="#22d3ee"
              iconBackground="rgba(6,182,212,.15)"
              badge={
                stats.pendingOnlinePayments
              }
            />

            <MenuCard
              href="/admin/bill-management"
              title="بل مینجمنٹ"
              icon={<List size={19} />}
              iconColor="#60a5fa"
              iconBackground="rgba(59,130,246,.15)"
            />

            <MenuCard
              href="/admin/collection-list"
              title="وصولی لسٹ"
              icon={<FileText size={19} />}
              iconColor="#a78bfa"
              iconBackground="rgba(139,92,246,.15)"
            />

            <MenuCard
              href="/admin/expenses"
              title="روزمرہ اخراجات"
              icon={<DollarSign size={19} />}
              iconColor="#f87171"
              iconBackground="rgba(239,68,68,.15)"
            />

            <MenuCard
              href="/admin/expense-report"
              title="خرچ رپورٹ"
              icon={<PieChart size={19} />}
              iconColor="#fbbf24"
              iconBackground="rgba(245,158,11,.15)"
            />

            {/* ===============================================
                NEW BUTTON 1
                INCOME REPORT
            =============================================== */}

            <MenuCard
              href="/admin/income-report"
              title="انکم رپورٹ"
              icon={<WalletCards size={19} />}
              iconColor="#34d399"
              iconBackground="rgba(16,185,129,.15)"
              borderColor="#059669"
            />

            {/* ===============================================
                NEW BUTTON 2
                ALL REPORTS
            =============================================== */}

            <MenuCard
              href="/admin/all-reports"
              title="آل رپورٹس"
              icon={<BarChart3 size={19} />}
              iconColor="#c084fc"
              iconBackground="rgba(168,85,247,.15)"
              borderColor="#7c3aed"
            />
          </div>
        </div>

        {/* ===================================================
            ADMIN SECTION
        =================================================== */}

        <div
          style={{
            background:
              'linear-gradient(145deg, #0b1b2e, #0b2034)',
            border: '1px solid #183a55',
            borderRadius: '16px',
            padding: '14px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '13px',
              borderBottom: '1px solid #183a55',
              paddingBottom: '9px'
            }}
          >
            <span
              style={{
                background:
                  'linear-gradient(135deg,#db2777,#7c3aed)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '4px 9px',
                borderRadius: '7px',
                direction: 'ltr'
              }}
            >
              Admin Section
            </span>

            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: '800',
                color: '#f472b6'
              }}
            >
              صارفین و نیٹ ورک کنٹرول پینل
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(125px, 1fr))',
              gap: '9px'
            }}
          >
            <MenuCard
              href="/admin/new-connection"
              title="نیا کنکشن"
              icon={<UserPlus size={19} />}
              iconColor="#38bdf8"
              iconBackground="rgba(59,130,246,.15)"
            />

            <MenuCard
              href="/admin/user-list"
              title="یوزر لسٹ"
              icon={<Users size={19} />}
              iconColor="#34d399"
              iconBackground="rgba(16,185,129,.15)"
            />

            <MenuCard
              href="/admin/packages"
              title="پیکجز سیٹ اپ"
              icon={<Package size={19} />}
              iconColor="#f472b6"
              iconBackground="rgba(236,72,153,.15)"
            />

            <MenuCard
              href="/admin/complaints"
              title="کیبل و شکایت"
              icon={<Wrench size={19} />}
              iconColor="#fbbf24"
              iconBackground="rgba(245,158,11,.15)"
              badge={stats.pendingComplaints}
            />

            <MenuCard
              href="/admin/mikrotik-config"
              title="مائیکروٹک کنفیگ"
              icon={<Settings size={19} />}
              iconColor="#22d3ee"
              iconBackground="rgba(6,182,212,.15)"
            />

            <MenuCard
              href="/admin/connection-check"
              title="سگنل چیک"
              icon={<Activity size={19} />}
              iconColor="#34d399"
              iconBackground="rgba(16,185,129,.15)"
              borderColor="#059669"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}