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
  MessageSquare,
  AlertCircle,
  Wifi,
  User,
  Phone,
  RotateCcw,
  X,
  Receipt,
  History
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface CollectionType {
  id: number;
  customer_id: number;
  previous_arrears: number;
  current_bill: number;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  payment_date: string;
  payment_method?: string | null;
  receipt_number?: string | null;
  is_reversed?: boolean;
  reversed_at?: string | null;
  reversal_reason?: string | null;
}

interface CustomerStatusType {
  id: number;
  serial_number: string;
  full_name: string;
  father_name: string;
  pppoe_username: string;
  phone: string;
  whatsapp: string;
  package_name: string;
  speed: string;
  monthly_price: number;
  connection_charges: number;
  password: string;

  last_paid_amount: number;
  remaining_balance: number;
  is_paid: boolean;

  latestCollection: CollectionType | null;
}

interface TotalsType {
  collectedAmount: number;
  pendingAmount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const PORTAL_URL = 'https://khanfiber.vercel.app';

// ============================================================
// MAIN PAGE
// ============================================================

export default function CollectionListPage() {
  const [customers, setCustomers] =
    useState<CustomerStatusType[]>([]);

  const [activeTab, setActiveTab] =
    useState<'paid' | 'pending'>('pending');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [fetching, setFetching] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [totals, setTotals] =
    useState<TotalsType>({
      collectedAmount: 0,
      pendingAmount: 0
    });

  // ==========================================================
  // REVERSE PAYMENT STATES
  // ==========================================================

  const [reverseCustomer, setReverseCustomer] =
    useState<CustomerStatusType | null>(null);

  const [reverseCollection, setReverseCollection] =
    useState<CollectionType | null>(null);

  const [reversalReason, setReversalReason] =
    useState('');

  const [reversing, setReversing] =
    useState(false);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const fetchData = async () => {
    setFetching(true);
    setErrorMessage('');

    try {
      // ------------------------------------------------------
      // CUSTOMERS
      // ------------------------------------------------------

      const {
        data: custData,
        error: custError
      } = await supabase
        .from('customers')
        .select(`
          id,
          serial_number,
          full_name,
          father_name,
          pppoe_username,
          phone,
          whatsapp,
          package_name,
          speed,
          monthly_price,
          connection_charges,
          password
        `)
        .order('full_name', {
          ascending: true
        });

      if (custError) {
        throw new Error(
          `Customers Error: ${custError.message}`
        );
      }

      // ------------------------------------------------------
      // COLLECTIONS
      // ------------------------------------------------------

      const {
        data: colData,
        error: colError
      } = await supabase
        .from('collections')
        .select(`
          id,
          customer_id,
          previous_arrears,
          current_bill,
          total_amount,
          paid_amount,
          remaining_balance,
          payment_date,
          payment_method,
          receipt_number,
          is_reversed,
          reversed_at,
          reversal_reason
        `)
        .order('id', {
          ascending: false
        });

      if (colError) {
        throw new Error(
          `Collections Error: ${colError.message}`
        );
      }

      const allCollections: CollectionType[] =
        (colData || []).map((item: any) => ({
          id: Number(item.id),
          customer_id: Number(item.customer_id),

          previous_arrears:
            Number(item.previous_arrears || 0),

          current_bill:
            Number(item.current_bill || 0),

          total_amount:
            Number(item.total_amount || 0),

          paid_amount:
            Number(item.paid_amount || 0),

          remaining_balance:
            Number(item.remaining_balance || 0),

          payment_date:
            item.payment_date || '',

          payment_method:
            item.payment_method || null,

          receipt_number:
            item.receipt_number || null,

          is_reversed:
            Boolean(item.is_reversed),

          reversed_at:
            item.reversed_at || null,

          reversal_reason:
            item.reversal_reason || null
        }));

      // ------------------------------------------------------
      // FORMAT CUSTOMERS
      // ------------------------------------------------------

      const formattedList: CustomerStatusType[] =
        (custData || []).map((customer: any) => {
          /*
            IMPORTANT:
            Reversed collections کو current balance calculation
            میں شامل نہیں کیا جائے گا۔
          */

          const validCollections =
            allCollections.filter(
              collection =>
                Number(collection.customer_id) ===
                  Number(customer.id) &&
                !collection.is_reversed
            );

          const latestCollection =
            validCollections.length > 0
              ? validCollections[0]
              : null;

          const initialAmount =
            Number(customer.connection_charges || 0) +
            Number(customer.monthly_price || 0);

          const remainingBalance =
            latestCollection
              ? Number(
                  latestCollection.remaining_balance || 0
                )
              : initialAmount;

          const lastPaidAmount =
            latestCollection
              ? Number(
                  latestCollection.paid_amount || 0
                )
              : 0;

          return {
            id: Number(customer.id),

            serial_number:
              customer.serial_number || '---',

            full_name:
              customer.full_name || 'نامعلوم',

            father_name:
              customer.father_name || '---',

            pppoe_username:
              customer.pppoe_username || '---',

            phone:
              customer.phone || '---',

            whatsapp:
              customer.whatsapp ||
              customer.phone ||
              '---',

            package_name:
              customer.package_name || '---',

            speed:
              customer.speed || '---',

            monthly_price:
              Number(customer.monthly_price || 0),

            connection_charges:
              Number(customer.connection_charges || 0),

            password:
              customer.password || '12345',

            last_paid_amount:
              lastPaidAmount,

            remaining_balance:
              remainingBalance,

            is_paid:
              remainingBalance <= 0,

            latestCollection
          };
        });

      // ------------------------------------------------------
      // TOTAL COLLECTED
      // Reversed payment total میں شامل نہیں ہوگی
      // ------------------------------------------------------

      let totalCollected = 0;

      allCollections.forEach(collection => {
        if (!collection.is_reversed) {
          totalCollected +=
            Number(collection.paid_amount || 0);
        }
      });

      // ------------------------------------------------------
      // TOTAL PENDING
      // ------------------------------------------------------

      let totalPending = 0;

      formattedList.forEach(customer => {
        if (customer.remaining_balance > 0) {
          totalPending +=
            customer.remaining_balance;
        }
      });

      setCustomers(formattedList);

      setTotals({
        collectedAmount: totalCollected,
        pendingAmount: totalPending
      });
    } catch (err: any) {
      console.error(
        'Fetch Collection Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'ڈیٹا لوڈ کرنے میں خرابی پیش آئی۔'
      );
    } finally {
      setFetching(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================================
  // COUNTERS
  // ==========================================================

  const totalUsers =
    customers.length;

  const paidCount =
    customers.filter(
      customer => customer.is_paid
    ).length;

  const pendingCount =
    customers.filter(
      customer => !customer.is_paid
    ).length;

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredCustomers =
    customers.filter(customer => {
      const matchesTab =
        activeTab === 'paid'
          ? customer.is_paid
          : !customer.is_paid;

      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const matchesSearch =
        search === '' ||

        customer.full_name
          .toLowerCase()
          .includes(search) ||

        customer.father_name
          .toLowerCase()
          .includes(search) ||

        customer.pppoe_username
          .toLowerCase()
          .includes(search) ||

        customer.serial_number
          .toLowerCase()
          .includes(search) ||

        customer.phone
          .toLowerCase()
          .includes(search);

      return (
        matchesTab &&
        matchesSearch
      );
    });

  // ==========================================================
  // OPEN REVERSE PAYMENT
  // ==========================================================

  const openReversePayment = (
    customer: CustomerStatusType
  ) => {
    if (!customer.latestCollection) {
      alert(
        'اس صارف کی کوئی وصول شدہ Payment موجود نہیں ہے۔'
      );

      return;
    }

    if (
      Number(
        customer.latestCollection.paid_amount || 0
      ) <= 0
    ) {
      alert(
        'اس Collection میں وصول شدہ رقم موجود نہیں ہے۔'
      );

      return;
    }

    setReverseCustomer(customer);
    setReverseCollection(
      customer.latestCollection
    );

    setReversalReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeReverseModal = () => {
    if (reversing) {
      return;
    }

    setReverseCustomer(null);
    setReverseCollection(null);
    setReversalReason('');
  };

  // ==========================================================
  // CONFIRM REVERSE
  // ==========================================================

  const handleReversePayment = async () => {
    if (
      !reverseCustomer ||
      !reverseCollection
    ) {
      return;
    }

    if (!reversalReason.trim()) {
      alert(
        'Payment Reverse کرنے کی وجہ ضرور لکھیں۔'
      );

      return;
    }

    const confirmed =
      window.confirm(
        `کیا آپ واقعی ${reverseCustomer.full_name} کی Rs ${Number(
          reverseCollection.paid_amount
        ).toLocaleString()} Payment Reverse کرنا چاہتے ہیں؟\n\nیہ رقم وصول شدہ Total سے نکل جائے گی اور کسٹمر کا بقایا دوبارہ بحال ہو جائے گا۔`
      );

    if (!confirmed) {
      return;
    }

    setReversing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // ------------------------------------------------------
      // SECURITY CHECK
      // دوبارہ database سے collection حاصل کریں
      // ------------------------------------------------------

      const {
        data: currentCollection,
        error: checkError
      } = await supabase
        .from('collections')
        .select(`
          id,
          customer_id,
          paid_amount,
          is_reversed
        `)
        .eq('id', reverseCollection.id)
        .single();

      if (checkError) {
        throw checkError;
      }

      if (!currentCollection) {
        throw new Error(
          'Payment record نہیں ملا۔'
        );
      }

      if (currentCollection.is_reversed) {
        throw new Error(
          'یہ Payment پہلے ہی Reverse ہو چکی ہے۔'
        );
      }

      if (
        Number(currentCollection.customer_id) !==
        Number(reverseCustomer.id)
      ) {
        throw new Error(
          'Customer اور Payment record match نہیں کرتے۔'
        );
      }

      // ------------------------------------------------------
      // REVERSE PAYMENT
      // ------------------------------------------------------

      const {
        error: reverseError
      } = await supabase
        .from('collections')
        .update({
          is_reversed: true,
          reversed_at:
            new Date().toISOString(),
          reversal_reason:
            reversalReason.trim()
        })
        .eq('id', reverseCollection.id)
        .eq('is_reversed', false);

      if (reverseError) {
        throw reverseError;
      }

      const reversedAmount =
        Number(
          reverseCollection.paid_amount || 0
        );

      setSuccessMessage(
        `${reverseCustomer.full_name} کی Rs ${reversedAmount.toLocaleString()} Payment کامیابی سے Reverse کر دی گئی ہے۔`
      );

      setReverseCustomer(null);
      setReverseCollection(null);
      setReversalReason('');

      // ------------------------------------------------------
      // REFRESH BALANCES
      // ------------------------------------------------------

      await fetchData();
    } catch (err: any) {
      console.error(
        'Reverse Payment Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'Payment Reverse کرنے میں خرابی پیش آئی۔'
      );
    } finally {
      setReversing(false);
    }
  };

  // ==========================================================
  // WHATSAPP PAYMENT REMINDER
  // ==========================================================

  const handleSendReminder = (
    customer: CustomerStatusType
  ) => {
    const targetPhone =
      customer.whatsapp &&
      customer.whatsapp !== '---'
        ? customer.whatsapp
        : customer.phone;

    if (
      !targetPhone ||
      targetPhone === '---'
    ) {
      alert(
        'اس صارف کا WhatsApp یا فون نمبر موجود نہیں ہے!'
      );

      return;
    }

    const currentDate =
      new Date().toLocaleDateString(
        'en-GB'
      );

    const portalUsername =
      customer.serial_number;

    const portalPassword =
      customer.password || '12345';

    const reminderMessage =
`🌐 *ONE CLICK | HAIDER FIBER NETWORK*
━━━━━━━━━━━━━━━━━━
🔔 *بل یاددہانی / PAYMENT REMINDER*

محترم *${customer.full_name}*!

آپ کے انٹرنیٹ اکاؤنٹ پر بل واجب الادا ہے۔

━━━━━━━━━━━━━━━━━━
👤 *صارف کی تفصیلات*
━━━━━━━━━━━━━━━━━━

🆔 *Customer ID:* ${customer.serial_number}
🔐 *PPPoE User:* ${customer.pppoe_username}
📦 *Package:* ${customer.package_name}
⚡ *Speed:* ${customer.speed}

━━━━━━━━━━━━━━━━━━
💰 *بل کی تفصیلات*
━━━━━━━━━━━━━━━━━━

💵 *ماہانہ بل:* Rs ${customer.monthly_price.toLocaleString()}

🔴 *کل واجب الادا رقم:*
*Rs ${customer.remaining_balance.toLocaleString()}*

⚠️ براہِ مہربانی اپنا واجب الادا بل جلد از جلد جمع کروائیں۔

وقت پر بل جمع نہ کروانے کی صورت میں انٹرنیٹ سروس عارضی طور پر معطل کی جا سکتی ہے۔

اگر آپ بل پہلے ہی جمع کروا چکے ہیں تو اپنی ادائیگی کی رسید/Transaction ID محفوظ رکھیں۔

━━━━━━━━━━━━━━━━━━
📱 *CUSTOMER PORTAL / APP*
━━━━━━━━━━━━━━━━━━

اپنے کنکشن کی معلومات، موجودہ بل، بقایا رقم، بل کی ادائیگی اور شکایات کے لیے ہمارا Customer Portal استعمال کریں۔

🌐 *Portal Address:*
${PORTAL_URL}

🔑 *Portal Login Details*

👤 *User / Customer ID:*
${portalUsername}

🔒 *Password:*
${portalPassword}

اوپر دیے گئے User اور Password کے ذریعے Portal میں Login کریں۔

📲 *اپنے موبائل میں ہماری App انسٹال کریں*

Portal کھول کر اسے اپنے موبائل کی Home Screen پر Install/Add کریں۔

اس App/Portal سے آپ:

✅ اپنے کنکشن کی معلومات دیکھ سکتے ہیں
✅ اپنا پیکیج اور انٹرنیٹ سپیڈ دیکھ سکتے ہیں
✅ موجودہ بل اور بقایا رقم چیک کر سکتے ہیں
✅ Online Bill Payment کر سکتے ہیں
✅ Payment Status چیک کر سکتے ہیں
✅ اپنی شکایت درج کر سکتے ہیں
✅ اپنے اکاؤنٹ کی معلومات دیکھ سکتے ہیں

📅 *Reminder Date:* ${currentDate}

━━━━━━━━━━━━━━━━━━

شکریہ ❤️

*ONE CLICK*
*Haider Fiber Network (SMC-Private) Limited*
*Your Network Solution*`;

    try {
      openWhatsAppDirect(
        targetPhone,
        reminderMessage
      );
    } catch (error) {
      console.error(
        'WhatsApp Error:',
        error
      );

      alert(
        'WhatsApp کھولنے میں خرابی پیش آئی۔'
      );
    }
  };

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%'
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg,#10253e,#0b1e33)',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #3b82f6'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                backgroundColor:
                  'rgba(139,92,246,0.18)',
                padding: '9px',
                borderRadius: '10px',
                color: '#a78bfa'
              }}
            >
              <FileText size={20} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#ffffff'
                }}
              >
                بل وصولی لسٹ
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '10px',
                  color: '#94a3b8'
                }}
              >
                One Click • Haider Fiber Network
              </p>
            </div>
          </div>
        </div>

        {/* SUCCESS */}

        {successMessage && (
          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={17} />
            {successMessage}
          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={17} />
            {errorMessage}
          </div>
        )}

        {/* ANALYTICS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(145px,1fr))',
            gap: '10px',
            width: '100%'
          }}
        >
          <AnalyticsCard
            title="کل صارفین"
            value={`${totalUsers} یوزرز`}
            color="#60a5fa"
            icon={<Users size={18} />}
          />

          <AnalyticsCard
            title={`کل وصول شدہ (${paidCount} مکمل ادا)`}
            value={`Rs ${totals.collectedAmount.toLocaleString()}`}
            color="#34d399"
            icon={<TrendingUp size={18} />}
          />

          <AnalyticsCard
            title={`کل پینڈنگ (${pendingCount} یوزرز)`}
            value={`Rs ${totals.pendingAmount.toLocaleString()}`}
            color="#f87171"
            icon={<CreditCard size={18} />}
          />
        </div>

        {/* TABS + SEARCH */}

        <div
          style={{
            background:
              'linear-gradient(180deg,#10233c,#0d1d32)',
            borderRadius: '14px',
            padding: '12px',
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              backgroundColor: '#071829',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #334155',
              display: 'flex',
              gap: '6px'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setActiveTab('pending')
              }
              style={{
                ...tabButtonStyle,
                background:
                  activeTab === 'pending'
                    ? 'linear-gradient(135deg,#991b1b,#7f1d1d)'
                    : 'transparent',

                color:
                  activeTab === 'pending'
                    ? '#ffffff'
                    : '#94a3b8'
              }}
            >
              <Clock size={14} />
              پینڈنگ ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab('paid')
              }
              style={{
                ...tabButtonStyle,

                background:
                  activeTab === 'paid'
                    ? 'linear-gradient(135deg,#047857,#065f46)'
                    : 'transparent',

                color:
                  activeTab === 'paid'
                    ? '#ffffff'
                    : '#94a3b8'
              }}
            >
              <CheckCircle2 size={14} />
              وصول شدہ ({paidCount})
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: 1
              }}
            >
              <input
                type="text"
                placeholder="نام، HFN ID، PPPoE یا فون..."
                value={searchTerm}
                onChange={e =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#071829',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  padding:
                    '10px 38px 10px 10px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />

              <Search
                size={15}
                style={{
                  position: 'absolute',
                  right: '11px',
                  top: '11px',
                  color: '#38bdf8'
                }}
              />
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={fetching}
              style={{
                backgroundColor: '#071829',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '9px 11px',
                borderRadius: '9px',
                cursor:
                  fetching
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              <RefreshCw
                size={15}
                className={
                  fetching
                    ? 'animate-spin'
                    : ''
                }
              />
              ریفریش
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div
          style={{
            background:
              'linear-gradient(180deg,#10233c,#0d1d32)',
            borderRadius: '14px',
            padding: '10px',
            border: '1px solid #334155',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {fetching ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#38bdf8',
                fontSize: '12px'
              }}
            >
              <RefreshCw
                size={20}
                className="animate-spin"
                style={{
                  marginBottom: '8px'
                }}
              />

              <div>
                Supabase سے ڈیٹا لوڈ ہو رہا ہے...
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div
              style={{
                padding: '30px 10px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '12px'
              }}
            >
              کوئی ریکارڈ نہیں ملا۔
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                minWidth: '1050px',
                borderCollapse: 'collapse',
                textAlign: 'right',
                fontSize: '11px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#071829',
                    borderBottom:
                      '1px solid #334155',
                    color: '#94a3b8'
                  }}
                >
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>HFN ID</th>
                  <th style={thStyle}>صارف</th>
                  <th style={thStyle}>PPPoE</th>
                  <th style={thStyle}>پیکیج</th>
                  <th style={thStyle}>ماہانہ بل</th>
                  <th style={thStyle}>آخری جمع</th>
                  <th style={thStyle}>بقایا</th>

                  <th
                    style={{
                      ...thStyle,
                      textAlign: 'center'
                    }}
                  >
                    سٹیٹس / ایکشن
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (user, index) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom:
                          '1px solid #1e293b'
                      }}
                    >
                      <td style={tdStyle}>
                        <span
                          style={{
                            color: '#64748b'
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            color: '#22d3ee',
                            fontWeight: 'bold',
                            direction: 'ltr'
                          }}
                        >
                          {user.serial_number}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px'
                          }}
                        >
                          <div
                            style={{
                              backgroundColor:
                                'rgba(59,130,246,0.15)',
                              padding: '5px',
                              borderRadius: '6px',
                              color: '#60a5fa'
                            }}
                          >
                            <User size={13} />
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 'bold',
                                color: '#ffffff'
                              }}
                            >
                              {user.full_name}
                            </div>

                            <div
                              style={{
                                marginTop: '2px',
                                color: '#64748b',
                                fontSize: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Phone size={9} />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color: '#38bdf8',
                          direction: 'ltr',
                          fontWeight: 'bold'
                        }}
                      >
                        {user.pppoe_username}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            color: '#c4b5fd',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.package_name}
                        </div>

                        <div
                          style={{
                            color: '#34d399',
                            fontSize: '9px',
                            marginTop: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Wifi size={9} />
                          {user.speed}
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color: '#38bdf8',
                          fontWeight: 'bold'
                        }}
                      >
                        Rs{' '}
                        {user.monthly_price.toLocaleString()}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color: '#34d399',
                          fontWeight: 'bold'
                        }}
                      >
                        Rs{' '}
                        {user.last_paid_amount.toLocaleString()}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            user.remaining_balance > 0
                              ? '#f87171'
                              : '#34d399',
                          fontWeight: '900'
                        }}
                      >
                        Rs{' '}
                        {user.remaining_balance.toLocaleString()}
                      </td>

                      {/* ACTIONS */}

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'center'
                        }}
                      >
                        {user.is_paid ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  'rgba(16,185,129,0.15)',
                                color: '#34d399',
                                border:
                                  '1px solid rgba(16,185,129,0.4)',
                                padding: '5px 9px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <CheckCircle2
                                size={11}
                              />
                              وصول شدہ
                            </span>

                            {/* REVERSE BUTTON */}

                            {user.latestCollection &&
                              user.latestCollection
                                .paid_amount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReversePayment(
                                      user
                                    )
                                  }
                                  title="اس Payment کو Reverse کریں"
                                  style={{
                                    background:
                                      'linear-gradient(135deg,#f59e0b,#d97706)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 9px',
                                    borderRadius: '7px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <RotateCcw
                                    size={11}
                                  />
                                  Reverse
                                </button>
                              )}
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  'rgba(239,68,68,0.15)',
                                color: '#f87171',
                                border:
                                  '1px solid rgba(239,68,68,0.4)',
                                padding: '5px 8px',
                                borderRadius: '9px',
                                fontSize: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Clock size={11} />
                              پینڈنگ
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleSendReminder(
                                  user
                                )
                              }
                              title="WhatsApp پر بل Reminder بھیجیں"
                              style={{
                                background:
                                  'linear-gradient(135deg,#10b981,#059669)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 9px',
                                borderRadius: '7px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <MessageSquare
                                size={11}
                              />
                              WhatsApp
                            </button>

                            {user.latestCollection &&
                              user.latestCollection
                                .paid_amount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReversePayment(
                                      user
                                    )
                                  }
                                  title="آخری Payment Reverse کریں"
                                  style={{
                                    backgroundColor:
                                      'rgba(245,158,11,0.15)',
                                    color: '#fbbf24',
                                    border:
                                      '1px solid #f59e0b',
                                    padding: '6px 8px',
                                    borderRadius: '7px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <RotateCcw
                                    size={11}
                                  />
                                  Reverse
                                </button>
                              )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================
          REVERSE PAYMENT MODAL
      ====================================================== */}

      {reverseCustomer &&
        reverseCollection && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor:
                'rgba(2,6,23,0.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '430px',
                background:
                  'linear-gradient(180deg,#17233f,#0f172a)',
                border: '1px solid #f59e0b',
                borderRadius: '16px',
                padding: '16px',
                boxShadow:
                  '0 25px 60px rgba(0,0,0,0.45)'
              }}
            >
              {/* MODAL HEADER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor:
                        'rgba(245,158,11,0.15)',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <RotateCcw size={18} />
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: '#ffffff',
                        fontSize: '15px'
                      }}
                    >
                      Reverse Payment
                    </h3>

                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: '9px',
                        marginTop: '2px'
                      }}
                    >
                      غلط وصول شدہ Payment واپس کریں
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeReverseModal}
                  disabled={reversing}
                  style={{
                    backgroundColor:
                      '#0f172a',
                    border:
                      '1px solid #334155',
                    color: '#94a3b8',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* WARNING */}

              <div
                style={{
                  backgroundColor:
                    'rgba(239,68,68,0.10)',
                  border:
                    '1px solid rgba(239,68,68,0.45)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#fca5a5',
                  fontSize: '10px',
                  lineHeight: '1.6',
                  marginBottom: '12px'
                }}
              >
                <strong>احتیاط:</strong>{' '}
                Reverse کرنے کے بعد یہ رقم وصول شدہ
                رقم سے نکل جائے گی اور کسٹمر کا بقایا
                دوبارہ بحال ہو جائے گا۔ اصل record
                delete نہیں ہوگا۔
              </div>

              {/* PAYMENT DETAILS */}

              <div
                style={{
                  backgroundColor: '#071829',
                  border:
                    '1px solid #334155',
                  borderRadius: '11px',
                  padding: '12px',
                  display: 'grid',
                  gap: '9px'
                }}
              >
                <ModalRow
                  label="Customer"
                  value={
                    reverseCustomer.full_name
                  }
                />

                <ModalRow
                  label="HFN ID"
                  value={
                    reverseCustomer.serial_number
                  }
                />

                <ModalRow
                  label="Payment Amount"
                  value={`Rs ${Number(
                    reverseCollection.paid_amount
                  ).toLocaleString()}`}
                  highlight
                />

                <ModalRow
                  label="Payment Date"
                  value={
                    reverseCollection.payment_date ||
                    '---'
                  }
                />

                <ModalRow
                  label="Payment Method"
                  value={
                    formatPaymentMethod(
                      reverseCollection.payment_method
                    )
                  }
                />

                <ModalRow
                  label="Receipt"
                  value={
                    reverseCollection.receipt_number ||
                    `COL-${reverseCollection.id}`
                  }
                />
              </div>

              {/* REASON */}

              <div
                style={{
                  marginTop: '13px'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}
                >
                  Reverse کرنے کی وجہ *
                </label>

                <textarea
                  value={reversalReason}
                  onChange={e =>
                    setReversalReason(
                      e.target.value
                    )
                  }
                  placeholder="مثلاً: غلط Customer کے اکاؤنٹ میں Payment وصول ہو گئی تھی..."
                  rows={3}
                  disabled={reversing}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    backgroundColor: '#071829',
                    border:
                      '1px solid #f59e0b',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '9px',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* BUTTONS */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '8px',
                  marginTop: '14px'
                }}
              >
                <button
                  type="button"
                  onClick={closeReverseModal}
                  disabled={reversing}
                  style={{
                    padding: '10px',
                    borderRadius: '9px',
                    border:
                      '1px solid #334155',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleReversePayment
                  }
                  disabled={
                    reversing ||
                    !reversalReason.trim()
                  }
                  style={{
                    padding: '10px',
                    borderRadius: '9px',
                    border: 'none',
                    background:
                      reversing ||
                      !reversalReason.trim()
                        ? '#475569'
                        : 'linear-gradient(135deg,#f59e0b,#d97706)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor:
                      reversing
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  {reversing ? (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <RotateCcw
                      size={14}
                    />
                  )}

                  {reversing
                    ? 'Reverse ہو رہی ہے...'
                    : 'Confirm Reverse'}
                </button>
              </div>
            </div>
          </div>
        )}
    </Layout>
  );
}

// ============================================================
// MODAL ROW
// ============================================================

function ModalRow({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}
    >
      <span
        style={{
          color: '#64748b',
          fontSize: '9px'
        }}
      >
        {label}
      </span>

      <span
        style={{
          color:
            highlight
              ? '#fbbf24'
              : '#ffffff',
          fontSize:
            highlight
              ? '13px'
              : '10px',
          fontWeight: 'bold',
          textAlign: 'right'
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// PAYMENT METHOD FORMAT
// ============================================================

function formatPaymentMethod(
  method?: string | null
) {
  if (!method) {
    return 'Cash';
  }

  const value =
    method.toLowerCase();

  if (value === 'cash') {
    return 'Cash';
  }

  if (value === 'easypaisa') {
    return 'Easypaisa';
  }

  if (value === 'jazzcash') {
    return 'JazzCash';
  }

  if (
    value === 'raast' ||
    value === 'rast'
  ) {
    return 'Raast';
  }

  if (value === 'sadapay') {
    return 'SadaPay';
  }

  if (value === 'nayapay') {
    return 'NayaPay';
  }

  if (value === 'bank') {
    return 'Bank Transfer';
  }

  return method;
}

// ============================================================
// ANALYTICS CARD
// ============================================================

function AnalyticsCard({
  title,
  value,
  color,
  icon
}: {
  title: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg,#17233f,#1c2541)',
        border: `1px solid ${color}`,
        borderRadius: '12px',
        padding: '11px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '62px'
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '10px',
            color,
            fontWeight: 'bold'
          }}
        >
          {title}
        </p>

        <h3
          style={{
            margin: '4px 0 0',
            fontSize: '16px',
            fontWeight: '900',
            color: '#ffffff'
          }}
        >
          {value}
        </h3>
      </div>

      <div
        style={{
          backgroundColor:
            'rgba(255,255,255,0.06)',
          padding: '8px',
          borderRadius: '8px',
          color
        }}
      >
        {icon}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const tabButtonStyle:
  React.CSSProperties = {
    flex: 1,
    padding: '9px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  };

const thStyle:
  React.CSSProperties = {
    padding: '9px 8px',
    fontSize: '10px',
    whiteSpace: 'nowrap'
  };

const tdStyle:
  React.CSSProperties = {
    padding: '9px 8px',
    whiteSpace: 'nowrap',
    color: '#cbd5e1'
  };