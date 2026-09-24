import React, {
  useEffect,
  useState
} from 'react';

import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';

import {
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Receipt,
  AlertCircle,
  User,
  CreditCard
} from 'lucide-react';

interface PaymentType {
  id: number;
  customer_id: number;

  transaction_id: string;

  payment_method: string;

  amount: number;

  receipt_url?: string | null;

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  created_at: string;

  customers?: {
    serial_number?: string;
    full_name: string;
    pppoe_username: string;
    phone: string;
    whatsapp: string;
    monthly_price?: number;
    connection_charges?: number;
    package_name?: string;
    speed?: string;
  };
}

export default function OnlinePaymentsPage() {
  const [payments, setPayments] =
    useState<PaymentType[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [fetching, setFetching] =
    useState(true);

  const [
    actionLoading,
    setActionLoading
  ] = useState<number | null>(null);

  const [
    selectedReceipt,
    setSelectedReceipt
  ] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  // =========================================================
  // FETCH PAYMENTS
  // =========================================================

  const fetchPayments = async () => {
    setFetching(true);
    setErrorMessage('');

    try {
      const {
        data,
        error
      } = await supabase
        .from('online_payments')
        .select(`
          id,
          customer_id,
          transaction_id,
          payment_method,
          amount,
          receipt_url,
          status,
          created_at,
          customers (
            serial_number,
            full_name,
            pppoe_username,
            phone,
            whatsapp,
            monthly_price,
            connection_charges,
            package_name,
            speed
          )
        `)
        .order('id', {
          ascending: false
        });

      if (error) {
        throw error;
      }

      setPayments(
        (data || []) as unknown as PaymentType[]
      );
    } catch (err: any) {
      console.error(
        'Fetch online payments error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'Online payments لوڈ نہیں ہو سکیں۔'
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // =========================================================
  // COUNTERS
  // =========================================================

  const pendingCount =
    payments.filter(
      (p) => p.status === 'pending'
    ).length;

  const approvedCount =
    payments.filter(
      (p) => p.status === 'approved'
    ).length;

  const rejectedCount =
    payments.filter(
      (p) => p.status === 'rejected'
    ).length;

  const pendingAmount =
    payments
      .filter(
        (p) => p.status === 'pending'
      )
      .reduce(
        (sum, p) =>
          sum + Number(p.amount || 0),
        0
      );

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredPayments =
    payments.filter((payment) => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      if (!search) return true;

      const name =
        payment.customers?.full_name
          ?.toLowerCase() || '';

      const username =
        payment.customers
          ?.pppoe_username
          ?.toLowerCase() || '';

      const serial =
        payment.customers
          ?.serial_number
          ?.toLowerCase() || '';

      const trx =
        payment.transaction_id
          ?.toLowerCase() || '';

      return (
        name.includes(search) ||
        username.includes(search) ||
        serial.includes(search) ||
        trx.includes(search)
      );
    });

  // =========================================================
  // APPROVE PAYMENT
  // =========================================================

  const handleApprove = async (
    payment: PaymentType
  ) => {
    if (
      payment.status !== 'pending'
    ) {
      alert(
        'یہ payment پہلے ہی process ہو چکی ہے۔'
      );
      return;
    }

    const confirmed =
      confirm(
        `کیا آپ Rs ${Number(
          payment.amount
        ).toLocaleString()} کی پیمنٹ منظور کرنا چاہتے ہیں؟\n\nTransaction ID: ${payment.transaction_id}`
      );

    if (!confirmed) return;

    setActionLoading(payment.id);
    setErrorMessage('');

    try {
      // -----------------------------------------------------
      // STEP 1:
      // تازہ payment status دوبارہ check کریں
      // -----------------------------------------------------

      const {
        data: freshPayment,
        error: freshError
      } = await supabase
        .from('online_payments')
        .select(`
          id,
          status,
          amount,
          customer_id
        `)
        .eq('id', payment.id)
        .single();

      if (freshError) {
        throw freshError;
      }

      if (
        freshPayment.status !==
        'pending'
      ) {
        throw new Error(
          'یہ payment پہلے ہی کسی action کے ذریعے process ہو چکی ہے۔'
        );
      }

      const paymentAmount =
        Number(
          freshPayment.amount || 0
        );

      if (paymentAmount <= 0) {
        throw new Error(
          'Payment amount درست نہیں ہے۔'
        );
      }

      // -----------------------------------------------------
      // STEP 2:
      // LATEST COLLECTION
      // -----------------------------------------------------

      const {
        data: latestCollections,
        error: collectionFetchError
      } = await supabase
        .from('collections')
        .select(`
          id,
          remaining_balance
        `)
        .eq(
          'customer_id',
          payment.customer_id
        )
        .order('id', {
          ascending: false
        })
        .limit(1);

      if (collectionFetchError) {
        throw collectionFetchError;
      }

      let currentDue = 0;

      // اگر collection پہلے سے موجود ہے
      if (
        latestCollections &&
        latestCollections.length > 0
      ) {
        currentDue =
          Number(
            latestCollections[0]
              .remaining_balance || 0
          );
      } else {
        // پہلی payment کی صورت میں
        // Connection Charges + Monthly Bill

        const {
          data: customerData,
          error: customerError
        } = await supabase
          .from('customers')
          .select(`
            monthly_price,
            connection_charges
          `)
          .eq(
            'id',
            payment.customer_id
          )
          .single();

        if (customerError) {
          throw customerError;
        }

        currentDue =
          Number(
            customerData
              ?.connection_charges || 0
          ) +
          Number(
            customerData
              ?.monthly_price || 0
          );
      }

      // -----------------------------------------------------
      // VALIDATE PAYMENT AGAINST CURRENT DUE
      // -----------------------------------------------------

      if (currentDue <= 0) {
        throw new Error(
          'اس صارف کا موجودہ بقایا صفر ہے۔ Payment approve نہیں کی گئی۔'
        );
      }

      if (
        paymentAmount > currentDue
      ) {
        throw new Error(
          `Payment رقم Rs ${paymentAmount.toLocaleString()} ہے جبکہ موجودہ بقایا Rs ${currentDue.toLocaleString()} ہے۔ پہلے ریکارڈ چیک کریں۔`
        );
      }

      const newRemaining =
        Math.max(
          0,
          currentDue -
            paymentAmount
        );

      // -----------------------------------------------------
      // STEP 3:
      // COLLECTION INSERT
      // -----------------------------------------------------

      const {
        error: collectionInsertError
      } = await supabase
        .from('collections')
        .insert([
          {
            customer_id:
              payment.customer_id,

            previous_arrears:
              currentDue,

            current_bill: 0,

            total_amount:
              currentDue,

            paid_amount:
              paymentAmount,

            remaining_balance:
              newRemaining,

            payment_date:
              new Date().toISOString()
          }
        ]);

      if (collectionInsertError) {
        throw collectionInsertError;
      }

      // -----------------------------------------------------
      // STEP 4:
      // PAYMENT APPROVE
      // -----------------------------------------------------

      const {
        data: updatedPayment,
        error: paymentUpdateError
      } = await supabase
        .from('online_payments')
        .update({
          status: 'approved'
        })
        .eq('id', payment.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (paymentUpdateError) {
        throw paymentUpdateError;
      }

      if (!updatedPayment) {
        throw new Error(
          'Payment status update نہیں ہوا۔ ریکارڈ دوبارہ check کریں۔'
        );
      }

      // -----------------------------------------------------
      // STEP 5:
      // WHATSAPP RECEIPT
      // -----------------------------------------------------

      const targetPhone =
        payment.customers?.whatsapp ||
        payment.customers?.phone;

      if (targetPhone) {
        const date =
          new Date().toLocaleDateString(
            'en-GB'
          );

        const approvedMsg =
          `🌐 *ONE CLICK | HAIDER FIBER NETWORK*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `✅ *PAYMENT CONFIRMED*\n\n` +

          `محترم *${payment.customers?.full_name || ''}*!\n\n` +

          `آپ کی آن لائن پیمنٹ کامیابی سے تصدیق کر دی گئی ہے۔\n\n` +

          `👤 *اکاؤنٹ تفصیلات*\n` +
          `▫️ HFN ID: ${payment.customers?.serial_number || '---'}\n` +
          `▫️ PPPoE: ${payment.customers?.pppoe_username || '---'}\n\n` +

          `💳 *Payment Details*\n` +
          `▫️ طریقہ: ${formatPaymentMethod(payment.payment_method)}\n` +
          `▫️ Transaction ID: ${payment.transaction_id}\n` +
          `✅ جمع رقم: Rs ${paymentAmount.toLocaleString()}\n` +
          `🔻 بقیہ واجبات: Rs ${newRemaining.toLocaleString()}\n\n` +

          `📅 تاریخ: ${date}\n\n` +

          `آپ کی ادائیگی کا شکریہ۔\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `*Haider Fiber Network Team*\n` +
          `Powered by *One Click*`;

        openWhatsAppDirect(
          targetPhone,
          approvedMsg
        );
      }

      alert(
        `Payment منظور ہو گئی۔\nنیا بقایا: Rs ${newRemaining.toLocaleString()}`
      );

      await fetchPayments();
    } catch (err: any) {
      console.error(
        'Approve payment error:',
        err
      );

      alert(
        'خرابی: ' +
          (
            err?.message ||
            'Payment approve نہیں ہو سکی۔'
          )
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // REJECT PAYMENT
  // =========================================================

  const handleReject = async (
    payment: PaymentType
  ) => {
    if (
      payment.status !== 'pending'
    ) {
      alert(
        'یہ payment پہلے ہی process ہو چکی ہے۔'
      );
      return;
    }

    const confirmed =
      confirm(
        `کیا آپ اس payment request کو Reject کرنا چاہتے ہیں؟\n\nTransaction ID: ${payment.transaction_id}`
      );

    if (!confirmed) return;

    setActionLoading(payment.id);

    try {
      const {
        data: updatedPayment,
        error
      } = await supabase
        .from('online_payments')
        .update({
          status: 'rejected'
        })
        .eq('id', payment.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!updatedPayment) {
        throw new Error(
          'یہ payment پہلے ہی process ہو چکی ہے۔'
        );
      }

      // -----------------------------------------------------
      // WHATSAPP REJECT MESSAGE
      // -----------------------------------------------------

      const targetPhone =
        payment.customers?.whatsapp ||
        payment.customers?.phone;

      if (targetPhone) {
        const rejectedMsg =
          `🌐 *ONE CLICK | HAIDER FIBER NETWORK*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `❌ *PAYMENT NOT VERIFIED*\n\n` +

          `محترم *${payment.customers?.full_name || ''}*!\n\n` +

          `آپ کی آن لائن پیمنٹ کی تصدیق نہیں ہو سکی۔\n\n` +

          `▫️ HFN ID: ${payment.customers?.serial_number || '---'}\n` +
          `▫️ Transaction ID: ${payment.transaction_id}\n` +
          `▫️ طریقہ ادائیگی: ${formatPaymentMethod(payment.payment_method)}\n` +
          `▫️ رقم: Rs ${Number(payment.amount).toLocaleString()}\n\n` +

          `براہِ کرم Transaction ID اور رسید دوبارہ چیک کریں اور درست معلومات کے ساتھ دوبارہ Payment Request بھیجیں۔\n\n` +

          `ضرورت کی صورت میں ایڈمن سے رابطہ کریں۔\n\n` +

          `━━━━━━━━━━━━━━━━━━\n` +
          `*Haider Fiber Network Team*\n` +
          `Powered by *One Click*`;

        openWhatsAppDirect(
          targetPhone,
          rejectedMsg
        );
      }

      await fetchPayments();
    } catch (err: any) {
      console.error(
        'Reject error:',
        err
      );

      alert(
        'منسوخ کرنے میں خرابی: ' +
          (
            err?.message ||
            'Unknown error'
          )
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // UI
  // =========================================================

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
            justifyContent:
              'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg,#10253e,#0b1e33)',
            padding: '14px 16px',
            borderRadius: '14px',
            border:
              '1px solid #3b82f6'
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
                  'rgba(59,130,246,0.18)',
                padding: '9px',
                borderRadius: '10px',
                color: '#60a5fa'
              }}
            >
              <Globe size={21} />
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
                آن لائن پیمنٹ ویریفیکیشن
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '10px',
                  color: '#93c5fd'
                }}
              >
                One Click • Haider Fiber
                Network
              </p>
            </div>
          </div>
        </div>

        {/* ANALYTICS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(140px,1fr))',
            gap: '9px'
          }}
        >
          <StatusCard
            title="Pending"
            value={`${pendingCount}`}
            subtitle={`Rs ${pendingAmount.toLocaleString()}`}
            color="#f59e0b"
            icon={<Clock size={17} />}
          />

          <StatusCard
            title="Approved"
            value={`${approvedCount}`}
            subtitle="Verified Payments"
            color="#10b981"
            icon={
              <CheckCircle2 size={17} />
            }
          />

          <StatusCard
            title="Rejected"
            value={`${rejectedCount}`}
            subtitle="Rejected Requests"
            color="#ef4444"
            icon={
              <XCircle size={17} />
            }
          />
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',
              border:
                '1px solid #ef4444',
              color: '#f87171',
              padding: '11px',
              borderRadius: '10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* SEARCH */}

        <div
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '14px',
            padding: '12px',
            border:
              '1px solid #334155',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '220px'
            }}
          >
            <input
              type="text"
              placeholder="نام، HFN ID، PPPoE یا Transaction ID..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor:
                  '#0f172a',
                border:
                  '1px solid #3b82f6',
                color: '#ffffff',
                padding:
                  '9px 38px 9px 10px',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />

            <Search
              size={14}
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
            onClick={fetchPayments}
            disabled={fetching}
            style={{
              backgroundColor:
                '#0f172a',
              color: '#38bdf8',
              border:
                '1px solid #334155',
              padding: '9px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw
              size={14}
              className={
                fetching
                  ? 'animate-spin'
                  : ''
              }
            />

            ریفریش
          </button>
        </div>

        {/* TABLE */}

        <div
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '14px',
            padding: '12px',
            border:
              '1px solid #334155',
            overflowX: 'auto',
            WebkitOverflowScrolling:
              'touch'
          }}
        >
          {fetching ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#38bdf8'
              }}
            >
              <Loader2
                size={22}
                className="animate-spin"
              />

              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px'
                }}
              >
                Online Payments لوڈ ہو
                رہی ہیں...
              </div>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                minWidth: '1000px',
                borderCollapse:
                  'collapse',
                textAlign: 'right',
                fontSize: '11px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor:
                      '#0f172a',
                    borderBottom:
                      '1px solid #334155',
                    color: '#94a3b8'
                  }}
                >
                  <th style={thStyle}>
                    #
                  </th>

                  <th style={thStyle}>
                    صارف
                  </th>

                  <th style={thStyle}>
                    طریقہ
                  </th>

                  <th style={thStyle}>
                    Transaction ID
                  </th>

                  <th style={thStyle}>
                    رقم
                  </th>

                  <th style={thStyle}>
                    رسید
                  </th>

                  <th
                    style={{
                      ...thStyle,
                      textAlign: 'center'
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      ...thStyle,
                      textAlign: 'center'
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign:
                          'center',
                        padding: '20px',
                        color: '#64748b'
                      }}
                    >
                      کوئی Online Payment
                      Request موجود نہیں۔
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(
                    (pay, index) => (
                      <tr
                        key={pay.id}
                        style={{
                          borderBottom:
                            '1px solid #1e293b'
                        }}
                      >
                        <td
                          style={tdStyle}
                        >
                          {index + 1}
                        </td>

                        {/* CUSTOMER */}

                        <td
                          style={tdStyle}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              gap: '7px',
                              alignItems:
                                'center'
                            }}
                          >
                            <User
                              size={14}
                              color="#60a5fa"
                            />

                            <div>
                              <div
                                style={{
                                  color:
                                    '#ffffff',
                                  fontWeight:
                                    'bold'
                                }}
                              >
                                {pay
                                  .customers
                                  ?.full_name ||
                                  'نامعلوم'}
                              </div>

                              <div
                                style={{
                                  color:
                                    '#38bdf8',
                                  fontSize:
                                    '9px',
                                  marginTop:
                                    '2px'
                                }}
                              >
                                HFN:{' '}
                                {pay
                                  .customers
                                  ?.serial_number ||
                                  '---'}
                              </div>

                              <div
                                style={{
                                  color:
                                    '#64748b',
                                  fontSize:
                                    '9px',
                                  direction:
                                    'ltr'
                                }}
                              >
                                {pay
                                  .customers
                                  ?.pppoe_username ||
                                  '---'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* METHOD */}

                        <td
                          style={tdStyle}
                        >
                          <span
                            style={{
                              backgroundColor:
                                '#0f172a',
                              padding:
                                '4px 7px',
                              borderRadius:
                                '5px',
                              border:
                                '1px solid #334155',
                              color:
                                '#cbd5e1'
                            }}
                          >
                            {formatPaymentMethod(
                              pay.payment_method
                            )}
                          </span>
                        </td>

                        {/* TRANSACTION */}

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              '#f472b6',
                            fontWeight:
                              'bold',
                            direction:
                              'ltr'
                          }}
                        >
                          {
                            pay.transaction_id
                          }
                        </td>

                        {/* AMOUNT */}

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              '#34d399',
                            fontWeight:
                              '900'
                          }}
                        >
                          Rs{' '}
                          {Number(
                            pay.amount
                          ).toLocaleString()}
                        </td>

                        {/* RECEIPT */}

                        <td
                          style={tdStyle}
                        >
                          {pay.receipt_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReceipt(
                                  pay.receipt_url ||
                                    null
                                )
                              }
                              style={{
                                backgroundColor:
                                  'rgba(59,130,246,0.15)',
                                color:
                                  '#60a5fa',
                                border:
                                  '1px solid rgba(59,130,246,0.4)',
                                padding:
                                  '5px 8px',
                                borderRadius:
                                  '6px',
                                cursor:
                                  'pointer',
                                display:
                                  'inline-flex',
                                alignItems:
                                  'center',
                                gap: '4px',
                                fontSize:
                                  '10px'
                              }}
                            >
                              <Eye
                                size={11}
                              />
                              دیکھیں
                            </button>
                          ) : (
                            <span
                              style={{
                                color:
                                  '#64748b'
                              }}
                            >
                              نہیں
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              'center'
                          }}
                        >
                          <PaymentStatus
                            status={
                              pay.status
                            }
                          />
                        </td>

                        {/* ACTION */}

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              'center'
                          }}
                        >
                          {pay.status ===
                          'pending' ? (
                            <div
                              style={{
                                display:
                                  'flex',
                                justifyContent:
                                  'center',
                                gap: '5px'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(
                                    pay
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  pay.id
                                }
                                style={{
                                  backgroundColor:
                                    '#10b981',
                                  color:
                                    '#ffffff',
                                  border:
                                    'none',
                                  padding:
                                    '6px 9px',
                                  borderRadius:
                                    '6px',
                                  cursor:
                                    'pointer',
                                  fontSize:
                                    '10px',
                                  fontWeight:
                                    'bold',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '3px'
                                }}
                              >
                                {actionLoading ===
                                pay.id ? (
                                  <Loader2
                                    size={
                                      11
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={
                                      12
                                    }
                                  />
                                )}

                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(
                                    pay
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  pay.id
                                }
                                style={{
                                  backgroundColor:
                                    'rgba(239,68,68,0.15)',
                                  color:
                                    '#f87171',
                                  border:
                                    '1px solid rgba(239,68,68,0.4)',
                                  padding:
                                    '6px 9px',
                                  borderRadius:
                                    '6px',
                                  cursor:
                                    'pointer',
                                  fontSize:
                                    '10px',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '3px'
                                }}
                              >
                                <XCircle
                                  size={12}
                                />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize:
                                  '10px',
                                color:
                                  '#64748b'
                              }}
                            >
                              مکمل
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* RECEIPT MODAL */}

        {selectedReceipt && (
          <div
            onClick={() =>
              setSelectedReceipt(null)
            }
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor:
                'rgba(0,0,0,0.80)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              style={{
                width: '100%',
                maxWidth: '550px',
                backgroundColor:
                  '#0f172a',
                border:
                  '1px solid #334155',
                borderRadius: '14px',
                padding: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '6px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  <Receipt
                    size={16}
                  />
                  Payment Receipt
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceipt(
                      null
                    )
                  }
                  style={{
                    backgroundColor:
                      '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    width: '28px',
                    height: '28px',
                    borderRadius:
                      '50%',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              <img
                src={selectedReceipt}
                alt="Payment Receipt"
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ===========================================================
// HELPERS
// ===========================================================

function formatPaymentMethod(
  method: string
) {
  switch (method) {
    case 'easypaisa':
      return 'Easypaisa';

    case 'jazzcash':
      return 'JazzCash';

    case 'raast':
      return 'Raast ID';

    case 'bank':
      return 'Bank Transfer';

    default:
      return method || 'Unknown';
  }
}

function PaymentStatus({
  status
}: {
  status:
    | 'pending'
    | 'approved'
    | 'rejected';
}) {
  if (status === 'approved') {
    return (
      <span
        style={{
          backgroundColor:
            'rgba(16,185,129,0.15)',
          color: '#34d399',
          border:
            '1px solid rgba(16,185,129,0.4)',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <CheckCircle2 size={10} />
        منظور شدہ
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        style={{
          backgroundColor:
            'rgba(239,68,68,0.15)',
          color: '#f87171',
          border:
            '1px solid rgba(239,68,68,0.4)',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <XCircle size={10} />
        منسوخ
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor:
          'rgba(245,158,11,0.15)',
        color: '#fbbf24',
        border:
          '1px solid rgba(245,158,11,0.4)',
        padding: '4px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px'
      }}
    >
      <Clock size={10} />
      Pending
    </span>
  );
}

function StatusCard({
  title,
  value,
  subtitle,
  color,
  icon
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: '#1c2541',
        border: `1px solid ${color}`,
        borderRadius: '11px',
        padding: '10px 12px',
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <div
          style={{
            color,
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: '#ffffff',
            fontSize: '17px',
            fontWeight: '900',
            marginTop: '2px'
          }}
        >
          {value}
        </div>

        <div
          style={{
            color: '#64748b',
            fontSize: '9px'
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ color }}>
        {icon}
      </div>
    </div>
  );
}

const thStyle:
  React.CSSProperties = {
  padding: '9px 8px',
  whiteSpace: 'nowrap'
};

const tdStyle:
  React.CSSProperties = {
  padding: '9px 8px',
  color: '#cbd5e1',
  whiteSpace: 'nowrap'
};