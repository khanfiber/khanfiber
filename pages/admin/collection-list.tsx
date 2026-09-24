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
  Phone
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

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
  last_paid_amount: number;
  remaining_balance: number;
  is_paid: boolean;
}

interface TotalsType {
  collectedAmount: number;
  pendingAmount: number;
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CollectionListPage() {
  const [customers, setCustomers] = useState<CustomerStatusType[]>([]);

  const [activeTab, setActiveTab] =
    useState<'paid' | 'pending'>('pending');

  const [searchTerm, setSearchTerm] = useState('');

  const [fetching, setFetching] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');

  // ==========================================================
  // ANALYTICS TOTALS
  // ==========================================================

  const [totals, setTotals] = useState<TotalsType>({
    collectedAmount: 0,
    pendingAmount: 0
  });

  // ==========================================================
  // LOAD DATA FROM SUPABASE
  // ==========================================================

  const fetchData = async () => {
    setFetching(true);
    setErrorMessage('');

    try {
      // ------------------------------------------------------
      // STEP 1: CUSTOMERS
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
          connection_charges
        `)
        .order('full_name', { ascending: true });

      if (custError) {
        throw new Error(
          `Customers Error: ${custError.message}`
        );
      }

      // ------------------------------------------------------
      // STEP 2: COLLECTIONS
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
          payment_date
        `)
        .order('id', { ascending: false });

      if (colError) {
        throw new Error(
          `Collections Error: ${colError.message}`
        );
      }

      // ------------------------------------------------------
      // FORMAT CUSTOMERS
      // ------------------------------------------------------

      const formattedList: CustomerStatusType[] =
        (custData || []).map((customer: any) => {

          // اس customer کی collections
          const customerCollections =
            (colData || []).filter(
              (collection: any) =>
                Number(collection.customer_id) ===
                Number(customer.id)
            );

          // چونکہ collections ID descending میں ہیں،
          // اس لیے پہلا record latest ہے
          const latestCollection =
            customerCollections.length > 0
              ? customerCollections[0]
              : null;

          // --------------------------------------------------
          // اگر ابھی کوئی collection نہیں ہوئی
          // تو Connection Charges + Monthly Bill pending ہوگا
          // --------------------------------------------------

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
              ? Number(latestCollection.paid_amount || 0)
              : 0;

          const isPaid =
            remainingBalance <= 0;

          return {
            id: customer.id,

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

            last_paid_amount:
              lastPaidAmount,

            remaining_balance:
              remainingBalance,

            is_paid:
              isPaid
          };
        });

      // ======================================================
      // CALCULATE ANALYTICS
      // ======================================================

      let totalCollected = 0;
      let totalPending = 0;

      // تمام collections میں وصول شدہ رقم
      (colData || []).forEach((collection: any) => {
        totalCollected +=
          Number(collection.paid_amount || 0);
      });

      // تمام customers کا موجودہ pending balance
      formattedList.forEach((customer) => {
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

  const totalUsers = customers.length;

  const paidCount =
    customers.filter(
      (customer) => customer.is_paid
    ).length;

  const pendingCount =
    customers.filter(
      (customer) => !customer.is_paid
    ).length;

  // ==========================================================
  // SEARCH + TAB FILTER
  // ==========================================================

  const filteredCustomers =
    customers.filter((customer) => {

      const matchesTab =
        activeTab === 'paid'
          ? customer.is_paid
          : !customer.is_paid;

      const search =
        searchTerm.toLowerCase().trim();

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

      return matchesTab && matchesSearch;
    });

  // ==========================================================
  // WHATSAPP REMINDER
  // ==========================================================

  const handleSendReminder = (
    customer: CustomerStatusType
  ) => {

    const targetPhone =
      customer.whatsapp ||
      customer.phone;

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
      new Date().toLocaleDateString('en-GB');

    const reminderMessage =
      `🌐 *ONE CLICK | HAIDER FIBER NETWORK*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔔 *بل یاددہانی / PAYMENT REMINDER*\n\n` +

      `محترم *${customer.full_name}*!\n\n` +

      `آپ کے انٹرنیٹ اکاؤنٹ پر بل واجب الادا ہے۔\n\n` +

      `👤 *صارف کی تفصیلات*\n` +
      `▫️ Customer ID: ${customer.serial_number}\n` +
      `▫️ PPPoE User: ${customer.pppoe_username}\n` +
      `▫️ Package: ${customer.package_name}\n` +
      `▫️ Speed: ${customer.speed}\n\n` +

      `💰 *بل کی تفصیلات*\n` +
      `▫️ ماہانہ بل: Rs ${customer.monthly_price.toLocaleString()}\n` +
      `🔻 *کل بقایا رقم: Rs ${customer.remaining_balance.toLocaleString()}*\n\n` +

      `⚠️ *براہِ مہربانی اپنا واجب الادا بل جلد از جلد جمع کروائیں۔*\n\n` +

      `وقت پر بل جمع نہ کروانے کی صورت میں انٹرنیٹ سروس عارضی طور پر معطل کی جا سکتی ہے۔\n\n` +

      `اگر آپ بل پہلے ہی جمع کروا چکے ہیں تو براہِ مہربانی اپنی رسید شیئر کر دیں۔\n\n` +

      `📅 تاریخ: ${currentDate}\n\n` +

      `━━━━━━━━━━━━━━━━━━\n` +
      `شکریہ!\n` +
      `*Haider Fiber Network Team*\n` +
      `Powered by *One Click*`;

    openWhatsAppDirect(
      targetPhone,
      reminderMessage
    );
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

        {/* ====================================================
            TOP HEADER
        ==================================================== */}

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

        {/* ====================================================
            ERROR MESSAGE
        ==================================================== */}

        {errorMessage && (

          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',
              border:
                '1px solid #ef4444',
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

        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(145px,1fr))',
            gap: '10px',
            width: '100%'
          }}
        >

          {/* TOTAL USERS */}

          <AnalyticsCard
            title="کل صارفین"
            value={`${totalUsers} یوزرز`}
            color="#60a5fa"
            icon={<Users size={18} />}
          />

          {/* COLLECTED */}

          <AnalyticsCard
            title={`کل وصول شدہ (${paidCount} مکمل ادا)`}
            value={`Rs ${totals.collectedAmount.toLocaleString()}`}
            color="#34d399"
            icon={<TrendingUp size={18} />}
          />

          {/* PENDING */}

          <AnalyticsCard
            title={`کل پینڈنگ (${pendingCount} یوزرز)`}
            value={`Rs ${totals.pendingAmount.toLocaleString()}`}
            color="#f87171"
            icon={<CreditCard size={18} />}
          />

        </div>

        {/* ====================================================
            TABS + SEARCH
        ==================================================== */}

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

          {/* TABS */}

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
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',

                background:
                  activeTab === 'pending'
                    ? 'linear-gradient(135deg,#991b1b,#7f1d1d)'
                    : 'transparent',

                color:
                  activeTab === 'pending'
                    ? '#ffffff'
                    : '#94a3b8',

                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
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
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',

                background:
                  activeTab === 'paid'
                    ? 'linear-gradient(135deg,#047857,#065f46)'
                    : 'transparent',

                color:
                  activeTab === 'paid'
                    ? '#ffffff'
                    : '#94a3b8',

                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >

              <CheckCircle2 size={14} />

              وصول شدہ ({paidCount})

            </button>

          </div>

          {/* SEARCH */}

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
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#071829',
                  border:
                    '1px solid #3b82f6',
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
                border:
                  '1px solid #334155',
                padding: '9px 11px',
                borderRadius: '9px',
                cursor: 'pointer',

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

              <span
                className="refreshText"
              >
                ریفریش
              </span>

            </button>

          </div>

        </div>

        {/* ====================================================
            LIST / TABLE
        ==================================================== */}

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
                minWidth: '950px',
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

                  <th style={thStyle}>
                    #
                  </th>

                  <th style={thStyle}>
                    HFN ID
                  </th>

                  <th style={thStyle}>
                    صارف
                  </th>

                  <th style={thStyle}>
                    PPPoE
                  </th>

                  <th style={thStyle}>
                    پیکیج
                  </th>

                  <th style={thStyle}>
                    ماہانہ بل
                  </th>

                  <th style={thStyle}>
                    آخری جمع
                  </th>

                  <th style={thStyle}>
                    بقایا
                  </th>

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

                      {/* HFN ID */}

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

                      {/* CUSTOMER */}

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

                      {/* PPPOE */}

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

                      {/* PACKAGE */}

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

                      {/* MONTHLY */}

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

                      {/* LAST PAID */}

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

                      {/* REMAINING */}

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

                      {/* STATUS */}

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'center'
                        }}
                      >

                        {user.is_paid ? (

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

                            {/* WHATSAPP BUTTON */}

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
                                display:
                                  'inline-flex',
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

    </Layout>
  );
}

// ============================================================
// ANALYTICS CARD COMPONENT
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
// TABLE STYLES
// ============================================================

const thStyle: React.CSSProperties = {
  padding: '9px 8px',
  fontSize: '10px',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '9px 8px',
  whiteSpace: 'nowrap',
  color: '#cbd5e1'
};