import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';

import {
  Receipt,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  WalletCards,
  Cable,
  CalendarDays,
  Banknote,
  FileText,
  User,
  Gauge
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type IncomeCategory =
  | 'monthly_charges'
  | 'connection_charges';

type PaymentMethod =
  | 'cash'
  | 'easypaisa'
  | 'jazzcash'
  | 'bank'
  | 'raast';

interface CustomerType {
  id: number;
  serial_number?: string | null;
  full_name: string;
  father_name?: string | null;
  pppoe_username: string;
  phone: string;
  whatsapp: string;
  monthly_price: number;
  connection_charges?: number;
  package_name?: string | null;
  speed?: string | null;
}

interface LatestCollectionType {
  id: number;
  remaining_balance: number;
  payment_date?: string | null;
}

/* =========================================================
   PAGE
========================================================= */

export default function BillCollection() {
  /* =======================================================
     CUSTOMER STATES
  ======================================================= */

  const [customers, setCustomers] =
    useState<CustomerType[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    selectedCustomer,
    setSelectedCustomer
  ] = useState<CustomerType | null>(null);

  const [customersLoading, setCustomersLoading] =
    useState(true);

  /* =======================================================
     BILL STATES
  ======================================================= */

  const [
    previousArrears,
    setPreviousArrears
  ] = useState(0);

  const [
    monthlyBill,
    setMonthlyBill
  ] = useState(0);

  const [
    connectionCharges,
    setConnectionCharges
  ] = useState(0);

  const [
    latestRemaining,
    setLatestRemaining
  ] = useState(0);

  /* =======================================================
     COLLECTION FORM
  ======================================================= */

  const [
    incomeCategory,
    setIncomeCategory
  ] = useState<IncomeCategory>(
    'monthly_charges'
  );

  const [
    paymentMethod,
    setPaymentMethod
  ] = useState<PaymentMethod>('cash');

  const [
    paidAmount,
    setPaidAmount
  ] = useState('');

  const [
    receiptNumber,
    setReceiptNumber
  ] = useState('');

  const [
    paymentNote,
    setPaymentNote
  ] = useState('');

  /* =======================================================
     UI STATES
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [
    customerLoading,
    setCustomerLoading
  ] = useState(false);

  const [
    isSuccess,
    setIsSuccess
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState('');

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  const loadCustomers = async () => {
    setCustomersLoading(true);

    try {
      const {
        data,
        error
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
          monthly_price,
          connection_charges,
          package_name,
          speed
        `)
        .order('full_name', {
          ascending: true
        });

      if (error) {
        throw error;
      }

      setCustomers(
        (data || []) as CustomerType[]
      );
    } catch (err: any) {
      console.error(
        'Customer Load Error:',
        err
      );

      setErrorMessage(
        `Customers Error: ${
          err?.message ||
          'Unknown error'
        }`
      );
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /* =======================================================
     FILTER CUSTOMERS
  ======================================================= */

  const filteredCustomers =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return [];
      }

      return customers
        .filter(customer => {
          const fullName =
            customer.full_name
              ?.toLowerCase() || '';

          const username =
            customer.pppoe_username
              ?.toLowerCase() || '';

          const serial =
            customer.serial_number
              ?.toLowerCase() || '';

          const phone =
            customer.phone || '';

          return (
            fullName.includes(search) ||
            username.includes(search) ||
            serial.includes(search) ||
            phone.includes(search)
          );
        })
        .slice(0, 15);
    }, [
      customers,
      searchTerm
    ]);

  /* =======================================================
     SELECT CUSTOMER
  ======================================================= */

  const handleSelectCustomer =
    async (
      customer: CustomerType
    ) => {
      setSelectedCustomer(customer);

      setSearchTerm(
        customer.full_name ||
        customer.pppoe_username
      );

      setCustomerLoading(true);

      setErrorMessage('');

      setIsSuccess(false);

      setPaidAmount('');

      setReceiptNumber('');

      setPaymentNote('');

      try {
        const monthly =
          Number(
            customer.monthly_price || 0
          );

        const connection =
          Number(
            customer.connection_charges || 0
          );

        setMonthlyBill(monthly);

        setConnectionCharges(
          connection
        );

        /* ===============================================
           GET LATEST COLLECTION
        =============================================== */

        const {
          data,
          error
        } = await supabase
          .from('collections')
          .select(`
            id,
            remaining_balance,
            payment_date
          `)
          .eq(
            'customer_id',
            customer.id
          )
          .order('id', {
            ascending: false
          })
          .limit(1);

        if (error) {
          throw error;
        }

        const latest =
          data &&
          data.length > 0
            ? (data[0] as LatestCollectionType)
            : null;

        /* ===============================================
           PREVIOUS ARREARS

           If collection exists:
           use last remaining balance.

           If first collection:
           connection charges become previous dues.
        =============================================== */

        const previous =
          latest
            ? Number(
                latest.remaining_balance ||
                0
              )
            : connection;

        setPreviousArrears(
          Math.max(0, previous)
        );

        setLatestRemaining(
          Math.max(0, previous)
        );

        /* ===============================================
           DEFAULT CATEGORY

           First payment with connection charges:
           Connection Charges

           Otherwise:
           Monthly Charges
        =============================================== */

        if (
          !latest &&
          connection > 0
        ) {
          setIncomeCategory(
            'connection_charges'
          );

          setPaidAmount(
            String(connection)
          );
        } else {
          setIncomeCategory(
            'monthly_charges'
          );

          setPaidAmount(
            String(monthly)
          );
        }
      } catch (err: any) {
        console.error(
          'Customer Billing Error:',
          err
        );

        setErrorMessage(
          `Billing Error: ${
            err?.message ||
            'Unknown error'
          }`
        );
      } finally {
        setCustomerLoading(false);
      }
    };

  /* =======================================================
     CATEGORY DUE
  ======================================================= */

  const selectedCategoryDue =
    useMemo(() => {
      if (!selectedCustomer) {
        return 0;
      }

      if (
        incomeCategory ===
        'connection_charges'
      ) {
        /*
          For first collection:
          connection charges.

          If arrears exist:
          available previous arrears.
        */

        if (
          latestRemaining > 0
        ) {
          return latestRemaining;
        }

        return connectionCharges;
      }

      return monthlyBill;
    }, [
      selectedCustomer,
      incomeCategory,
      latestRemaining,
      connectionCharges,
      monthlyBill
    ]);

  /* =======================================================
     TOTAL OUTSTANDING
  ======================================================= */

  const totalOutstanding =
    useMemo(() => {
      if (!selectedCustomer) {
        return 0;
      }

      return (
        Math.max(
          0,
          previousArrears
        ) +
        Math.max(
          0,
          monthlyBill
        )
      );
    }, [
      selectedCustomer,
      previousArrears,
      monthlyBill
    ]);

  /* =======================================================
     NUMERIC PAID
  ======================================================= */

  const numericPaid =
    useMemo(() => {
      const amount =
        Number(paidAmount || 0);

      if (
        Number.isNaN(amount)
      ) {
        return 0;
      }

      return amount;
    }, [paidAmount]);

  /* =======================================================
     REMAINING
  ======================================================= */

  const remainingBalance =
    useMemo(() => {
      return Math.max(
        0,
        totalOutstanding -
          numericPaid
      );
    }, [
      totalOutstanding,
      numericPaid
    ]);

  /* =======================================================
     CATEGORY CHANGE
  ======================================================= */

  const handleCategoryChange = (
    value: IncomeCategory
  ) => {
    setIncomeCategory(value);

    if (
      value ===
      'connection_charges'
    ) {
      const amount =
        latestRemaining > 0
          ? latestRemaining
          : connectionCharges;

      setPaidAmount(
        amount > 0
          ? String(amount)
          : ''
      );
    } else {
      setPaidAmount(
        monthlyBill > 0
          ? String(monthlyBill)
          : ''
      );
    }
  };

  /* =======================================================
     SAVE COLLECTION
  ======================================================= */

  const handleSaveBill =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (loading) return;

      setErrorMessage('');
      setIsSuccess(false);

      /* ===============================================
         VALIDATIONS
      =============================================== */

      if (!selectedCustomer) {
        setErrorMessage(
          'براہِ کرم پہلے صارف منتخب کریں۔'
        );

        return;
      }

      if (numericPaid <= 0) {
        setErrorMessage(
          'جمع شدہ رقم صفر سے زیادہ ہونی چاہیے۔'
        );

        return;
      }

      if (
        numericPaid >
        totalOutstanding
      ) {
        setErrorMessage(
          `جمع رقم کل واجبات Rs ${totalOutstanding.toLocaleString()} سے زیادہ نہیں ہو سکتی۔`
        );

        return;
      }

      setLoading(true);

      try {
        /* ===============================================
           GENERATE RECEIPT NUMBER
        =============================================== */

        const generatedReceipt =
          receiptNumber.trim() ||
          `HFN-${Date.now()}`;

        /* ===============================================
           INSERT COLLECTION
        =============================================== */

        const {
          error
        } = await supabase
          .from('collections')
          .insert([
            {
              customer_id:
                selectedCustomer.id,

              previous_arrears:
                previousArrears,

              current_bill:
                monthlyBill,

              total_amount:
                totalOutstanding,

              paid_amount:
                numericPaid,

              remaining_balance:
                remainingBalance,

              payment_date:
                new Date().toISOString(),

              income_category:
                incomeCategory,

              payment_method:
                paymentMethod,

              payment_note:
                paymentNote.trim() ||
                null,

              receipt_number:
                generatedReceipt
            }
          ]);

        if (error) {
          throw error;
        }

        setIsSuccess(true);

        /* ===============================================
           WHATSAPP RECEIPT
        =============================================== */

        const targetPhone =
          selectedCustomer.whatsapp ||
          selectedCustomer.phone;

        if (targetPhone) {
          const categoryText =
            incomeCategory ===
            'connection_charges'
              ? 'کنکشن چارجز'
              : 'ماہانہ چارجز';

          const paymentMethodText =
            paymentMethod === 'cash'
              ? 'کیش'
              : paymentMethod ===
                'easypaisa'
              ? 'ایزی پیسہ'
              : paymentMethod ===
                'jazzcash'
              ? 'جاز کیش'
              : paymentMethod ===
                'bank'
              ? 'بینک'
              : 'راست';

          const whatsappMsg =
`🌐 *ONE CLICK - HAIDER FIBER NETWORK* 🌐

🧾 *ادائیگی کی رسید*

محترم *${selectedCustomer.full_name}*!

آپ کی ادائیگی کامیابی سے ریکارڈ کر لی گئی ہے۔

━━━━━━━━━━━━━━
📋 *Payment Details*
━━━━━━━━━━━━━━

🆔 *Customer ID:* ${selectedCustomer.serial_number || '-'}

👤 *نام:* ${selectedCustomer.full_name}

📦 *کیٹیگری:* ${categoryText}

💳 *طریقہ ادائیگی:* ${paymentMethodText}

🧾 *Receipt No:* ${generatedReceipt}

💰 *جمع شدہ رقم:* Rs ${numericPaid.toLocaleString()}

📌 *کل واجبات:* Rs ${totalOutstanding.toLocaleString()}

🔻 *بقیہ واجبات:* Rs ${remainingBalance.toLocaleString()}

━━━━━━━━━━━━━━

آپ کی ادائیگی کا شکریہ ❤️

*One Click*
*Haider Fiber Network (SMC-Private) Limited*
Your Network Solution`;

          try {
            openWhatsAppDirect(
              targetPhone,
              whatsappMsg
            );
          } catch (
            whatsappError
          ) {
            console.error(
              'WhatsApp Error:',
              whatsappError
            );
          }
        }

        /* ===============================================
           UPDATE LOCAL BALANCE
        =============================================== */

        setPreviousArrears(
          remainingBalance
        );

        setLatestRemaining(
          remainingBalance
        );

        setPaidAmount('');

        setReceiptNumber('');

        setPaymentNote('');

        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      } catch (err: any) {
        console.error(
          'Collection Save Error:',
          err
        );

        setErrorMessage(
          `Supabase Error: ${
            err?.message ||
            'نامعلوم خرابی'
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     COMMON STYLES
  ======================================================= */

  const inputStyle:
    React.CSSProperties = {
      width: '100%',
      background:
        'linear-gradient(135deg,#071525,#091b2d)',
      border:
        '1px solid #1e4663',
      color: '#ffffff',
      padding:
        '11px 12px',
      borderRadius:
        '10px',
      fontSize: '12px',
      boxSizing:
        'border-box',
      outline: 'none'
    };

  const labelStyle:
    React.CSSProperties = {
      display: 'block',
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '700',
      marginBottom: '5px'
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#081a2c,#0b2035 55%,#09283a)',
            border:
              '1px solid #164e63',
            padding: '16px',
            borderRadius: '17px',
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            boxShadow:
              '0 10px 35px rgba(0,0,0,.20)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              background:
                'rgba(16,185,129,.12)',
              border:
                '1px solid rgba(52,211,153,.25)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Receipt size={23} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: '800',
                color: '#f8fafc'
              }}
            >
              بل وصولی
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                fontSize: '10px',
                color: '#64748b'
              }}
            >
              Monthly & Connection Charges Collection
            </p>
          </div>
        </div>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {isSuccess && (
          <div
            style={{
              background:
                'rgba(16,185,129,.10)',
              border:
                '1px solid rgba(16,185,129,.45)',
              color: '#34d399',
              padding: '11px 13px',
              borderRadius: '11px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <CheckCircle2 size={16} />

            بل کامیابی سے محفوظ ہو گیا اور انکم رپورٹ میں شامل ہو گیا ہے۔
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(239,68,68,.10)',
              border:
                '1px solid rgba(239,68,68,.45)',
              color: '#f87171',
              padding: '11px 13px',
              borderRadius: '11px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <AlertCircle size={16} />

            {errorMessage}
          </div>
        )}

        {/* =================================================
            CUSTOMER SEARCH
        ================================================= */}

        <div
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border:
              '1px solid #183a55',
            borderRadius: '15px',
            padding: '14px'
          }}
        >
          <label
            style={{
              ...labelStyle,
              color: '#67e8f9'
            }}
          >
            صارف تلاش کریں
          </label>

          <div
            style={{
              position: 'relative'
            }}
          >
            <input
              type="text"
              placeholder="نام، Customer ID، PPPoE یا فون..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(
                  e.target.value
                );

                setSelectedCustomer(
                  null
                );
              }}
              style={{
                ...inputStyle,
                paddingRight: '38px'
              }}
            />

            <Search
              size={16}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                color: '#64748b'
              }}
            />

            {searchTerm &&
              !selectedCustomer &&
              filteredCustomers.length >
                0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: '#071525',
                    border:
                      '1px solid #164e63',
                    borderRadius:
                      '10px',
                    maxHeight:
                      '240px',
                    overflowY:
                      'auto',
                    boxShadow:
                      '0 15px 35px rgba(0,0,0,.40)'
                  }}
                >
                  {filteredCustomers.map(
                    customer => (
                      <div
                        key={
                          customer.id
                        }
                        onClick={() =>
                          handleSelectCustomer(
                            customer
                          )
                        }
                        style={{
                          padding:
                            '10px 12px',
                          borderBottom:
                            '1px solid #14283c',
                          cursor:
                            'pointer',
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                '#ffffff',
                              fontSize:
                                '11px',
                              fontWeight:
                                '800'
                            }}
                          >
                            {
                              customer.full_name
                            }
                          </div>

                          <div
                            style={{
                              color:
                                '#64748b',
                              fontSize:
                                '9px',
                              marginTop:
                                '2px'
                            }}
                          >
                            {customer.serial_number ||
                              '-'}
                          </div>
                        </div>

                        <div
                          style={{
                            color:
                              '#22d3ee',
                            fontSize:
                              '10px',
                            direction:
                              'ltr'
                          }}
                        >
                          {
                            customer.pppoe_username
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            {customersLoading && (
              <Loader2
                size={15}
                className="animate-spin"
                style={{
                  position:
                    'absolute',
                  left: '12px',
                  top: '12px',
                  color: '#22d3ee'
                }}
              />
            )}
          </div>
        </div>

        {/* =================================================
            CUSTOMER INFO
        ================================================= */}

        {selectedCustomer && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px,1fr))',
              gap: '9px'
            }}
          >
            <InfoCard
              title="Customer ID"
              value={
                selectedCustomer.serial_number ||
                '-'
              }
              icon={
                <User size={17} />
              }
              color="#22d3ee"
            />

            <InfoCard
              title="Package"
              value={
                selectedCustomer.package_name ||
                '-'
              }
              icon={
                <Gauge size={17} />
              }
              color="#60a5fa"
            />

            <InfoCard
              title="Monthly Bill"
              value={`Rs ${monthlyBill.toLocaleString()}`}
              icon={
                <Receipt size={17} />
              }
              color="#a78bfa"
            />

            <InfoCard
              title="Previous / Connection Due"
              value={`Rs ${previousArrears.toLocaleString()}`}
              icon={
                <Cable size={17} />
              }
              color="#fbbf24"
            />
          </div>
        )}

        {/* =================================================
            COLLECTION FORM
        ================================================= */}

        <form
          onSubmit={
            handleSaveBill
          }
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border:
              '1px solid #183a55',
            borderRadius: '16px',
            padding: '16px'
          }}
        >
          {customerLoading ? (
            <div
              style={{
                padding: '25px',
                display: 'flex',
                justifyContent:
                  'center',
                alignItems:
                  'center',
                gap: '7px',
                color: '#22d3ee',
                fontSize: '11px'
              }}
            >
              <Loader2
                size={17}
                className="animate-spin"
              />

              صارف کا بل لوڈ ہو رہا ہے...
            </div>
          ) : (
            <>
              {/* CATEGORY */}

              <div
                style={{
                  marginBottom: '16px'
                }}
              >
                <label
                  style={{
                    ...labelStyle,
                    color: '#67e8f9'
                  }}
                >
                  انکم کیٹیگری *
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0,1fr))',
                    gap: '8px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleCategoryChange(
                        'monthly_charges'
                      )
                    }
                    style={{
                      background:
                        incomeCategory ===
                        'monthly_charges'
                          ? 'rgba(139,92,246,.18)'
                          : '#071525',

                      border:
                        incomeCategory ===
                        'monthly_charges'
                          ? '1px solid #8b5cf6'
                          : '1px solid #183a55',

                      color:
                        incomeCategory ===
                        'monthly_charges'
                          ? '#c4b5fd'
                          : '#94a3b8',

                      padding:
                        '12px 8px',

                      borderRadius:
                        '10px',

                      cursor:
                        'pointer',

                      fontSize:
                        '11px',

                      fontWeight:
                        '800',

                      display:
                        'flex',

                      justifyContent:
                        'center',

                      alignItems:
                        'center',

                      gap: '6px'
                    }}
                  >
                    <Receipt
                      size={15}
                    />

                    ماہانہ چارجز
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCategoryChange(
                        'connection_charges'
                      )
                    }
                    style={{
                      background:
                        incomeCategory ===
                        'connection_charges'
                          ? 'rgba(59,130,246,.18)'
                          : '#071525',

                      border:
                        incomeCategory ===
                        'connection_charges'
                          ? '1px solid #3b82f6'
                          : '1px solid #183a55',

                      color:
                        incomeCategory ===
                        'connection_charges'
                          ? '#93c5fd'
                          : '#94a3b8',

                      padding:
                        '12px 8px',

                      borderRadius:
                        '10px',

                      cursor:
                        'pointer',

                      fontSize:
                        '11px',

                      fontWeight:
                        '800',

                      display:
                        'flex',

                      justifyContent:
                        'center',

                      alignItems:
                        'center',

                      gap: '6px'
                    }}
                  >
                    <Cable
                      size={15}
                    />

                    کنکشن چارجز
                  </button>
                </div>
              </div>

              {/* GRID */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(200px,1fr))',
                  gap: '12px'
                }}
              >
                {/* CATEGORY DUE */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    منتخب کیٹیگری کی رقم
                  </label>

                  <input
                    readOnly
                    value={`Rs ${selectedCategoryDue.toLocaleString()}`}
                    style={{
                      ...inputStyle,
                      color:
                        '#67e8f9',
                      border:
                        '1px solid #0891b2',
                      fontWeight:
                        '800'
                    }}
                  />
                </div>

                {/* TOTAL */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    کل واجبات
                  </label>

                  <input
                    readOnly
                    value={`Rs ${totalOutstanding.toLocaleString()}`}
                    style={{
                      ...inputStyle,
                      color:
                        '#fbbf24',
                      border:
                        '1px solid #d97706',
                      fontWeight:
                        '800'
                    }}
                  />
                </div>

                {/* PAID */}

                <div>
                  <label
                    style={{
                      ...labelStyle,
                      color:
                        '#34d399'
                    }}
                  >
                    جمع شدہ رقم *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      paidAmount
                    }
                    onChange={e =>
                      setPaidAmount(
                        e.target
                          .value
                      )
                    }
                    placeholder="رقم درج کریں"
                    required
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #059669',
                      color:
                        '#34d399',
                      fontWeight:
                        '800'
                    }}
                  />
                </div>

                {/* REMAINING */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    بقیہ واجبات
                  </label>

                  <input
                    readOnly
                    value={`Rs ${remainingBalance.toLocaleString()}`}
                    style={{
                      ...inputStyle,
                      border:
                        remainingBalance >
                        0
                          ? '1px solid #dc2626'
                          : '1px solid #059669',

                      color:
                        remainingBalance >
                        0
                          ? '#f87171'
                          : '#34d399',

                      fontWeight:
                        '900'
                    }}
                  />
                </div>

                {/* METHOD */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    طریقہ ادائیگی
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={e =>
                      setPaymentMethod(
                        e.target
                          .value as PaymentMethod
                      )
                    }
                    style={{
                      ...inputStyle,
                      cursor:
                        'pointer'
                    }}
                  >
                    <option value="cash">
                      Cash
                    </option>

                    <option value="easypaisa">
                      Easypaisa
                    </option>

                    <option value="jazzcash">
                      JazzCash
                    </option>

                    <option value="raast">
                      Raast
                    </option>

                    <option value="bank">
                      Bank
                    </option>
                  </select>
                </div>

                {/* RECEIPT */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Receipt / Reference
                  </label>

                  <input
                    type="text"
                    value={
                      receiptNumber
                    }
                    onChange={e =>
                      setReceiptNumber(
                        e.target
                          .value
                      )
                    }
                    placeholder="خالی چھوڑیں تو Auto بنے گا"
                    style={
                      inputStyle
                    }
                  />
                </div>
              </div>

              {/* NOTE */}

              <div
                style={{
                  marginTop: '12px'
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  نوٹ
                </label>

                <textarea
                  rows={2}
                  value={
                    paymentNote
                  }
                  onChange={e =>
                    setPaymentNote(
                      e.target.value
                    )
                  }
                  placeholder="اختیاری نوٹ..."
                  style={{
                    ...inputStyle,
                    resize:
                      'vertical',
                    fontFamily:
                      'inherit'
                  }}
                />
              </div>

              {/* BUTTON */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  marginTop: '16px'
                }}
              >
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !selectedCustomer
                  }
                  style={{
                    background:
                      loading ||
                      !selectedCustomer
                        ? '#155e75'
                        : 'linear-gradient(135deg,#059669,#10b981)',

                    color:
                      '#ffffff',

                    border: 'none',

                    padding:
                      '11px 18px',

                    borderRadius:
                      '10px',

                    cursor:
                      loading ||
                      !selectedCustomer
                        ? 'not-allowed'
                        : 'pointer',

                    fontSize:
                      '11px',

                    fontWeight:
                      '800',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap: '7px'
                  }}
                >
                  {loading ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={15}
                    />
                  )}

                  {loading
                    ? 'محفوظ ہو رہا ہے...'
                    : 'بل محفوظ کریں اور رسید بھیجیں'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </Layout>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(145deg,#0b1b2e,#0b2034)',
        border:
          '1px solid #183a55',
        borderRadius: '12px',
        padding: '11px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '9px'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          background:
            `${color}18`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: '#64748b',
            fontSize: '9px'
          }}
        >
          {title}
        </div>

        <div
          style={{
            color,
            fontSize: '11px',
            fontWeight: '800',
            marginTop: '2px'
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}