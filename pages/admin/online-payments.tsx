import React, {
  useEffect,
  useMemo,
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
  WalletCards
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface PaymentType {
  id: number;
  customer_id: number;

  transaction_id: string | null;

  payment_method: string;
  amount: number;

  receipt_url?: string | null;

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  created_at: string;

  customers?: {
    full_name: string;
    serial_number?: string | null;
    pppoe_username: string;
    phone: string;
    whatsapp: string;
    monthly_price?: number;
    connection_charges?: number;
  } | null;
}

/* =========================================================
   PAGE
========================================================= */

export default function OnlinePaymentsPage() {
  const [payments, setPayments] =
    useState<PaymentType[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<
      'all' | 'pending' | 'approved' | 'rejected'
    >('pending');

  const [fetching, setFetching] =
    useState(true);

  const [
    actionLoading,
    setActionLoading
  ] = useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage
  ] = useState('');

  const [
    selectedReceipt,
    setSelectedReceipt
  ] = useState<string | null>(null);

  /* =========================================================
     FETCH PAYMENTS
  ========================================================= */

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
            full_name,
            serial_number,
            pppoe_username,
            phone,
            whatsapp,
            monthly_price,
            connection_charges
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
        'Online Payments Fetch Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'آن لائن پیمنٹس لوڈ نہیں ہو سکیں۔'
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredPayments =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return payments.filter(payment => {
        if (
          statusFilter !== 'all' &&
          payment.status !== statusFilter
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const name =
          payment.customers?.full_name
            ?.toLowerCase() || '';

        const username =
          payment.customers?.pppoe_username
            ?.toLowerCase() || '';

        const serial =
          payment.customers?.serial_number
            ?.toLowerCase() || '';

        const transaction =
          payment.transaction_id
            ?.toLowerCase() || '';

        return (
          name.includes(search) ||
          username.includes(search) ||
          serial.includes(search) ||
          transaction.includes(search)
        );
      });
    }, [
      payments,
      searchTerm,
      statusFilter
    ]);

  /* =========================================================
     COUNTERS
  ========================================================= */

  const counters =
    useMemo(() => {
      return {
        pending: payments.filter(
          p => p.status === 'pending'
        ).length,

        approved: payments.filter(
          p => p.status === 'approved'
        ).length,

        rejected: payments.filter(
          p => p.status === 'rejected'
        ).length
      };
    }, [payments]);

  /* =========================================================
     APPROVE PAYMENT
  ========================================================= */

  const handleApprove = async (
    payment: PaymentType
  ) => {
    if (
      payment.status !== 'pending'
    ) {
      alert(
        'یہ پیمنٹ پہلے ہی process ہو چکی ہے۔'
      );

      return;
    }

    const confirmed = window.confirm(
      `کیا آپ Rs ${Number(
        payment.amount
      ).toLocaleString()} کی آن لائن پیمنٹ منظور کرنا چاہتے ہیں؟`
    );

    if (!confirmed) return;

    setActionLoading(payment.id);
    setErrorMessage('');

    try {
      /* =====================================================
         STEP 1
         RECHECK PAYMENT STATUS

         Prevent accidental duplicate approval
      ===================================================== */

      const {
        data: freshPayment,
        error: freshError
      } = await supabase
        .from('online_payments')
        .select(`
          id,
          status,
          amount,
          customer_id,
          transaction_id,
          payment_method
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
          'یہ پیمنٹ پہلے ہی process ہو چکی ہے۔'
        );
      }

      /* =====================================================
         STEP 2
         GET LATEST CUSTOMER BALANCE
      ===================================================== */

      const {
        data: collectionData,
        error: collectionError
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

      if (collectionError) {
        throw collectionError;
      }

      const monthlyPrice =
        Number(
          payment.customers?.monthly_price || 0
        );

      const connectionCharges =
        Number(
          payment.customers
            ?.connection_charges || 0
        );

      /*
        If previous collection exists,
        use its remaining balance.

        Otherwise connection charges
        can be initial arrears.
      */

      const previousArrears =
        collectionData &&
        collectionData.length > 0
          ? Number(
              collectionData[0]
                .remaining_balance || 0
            )
          : connectionCharges;

      /*
        Total due follows same accounting
        model as Bill Collection.
      */

      const totalDue =
        Math.max(
          0,
          previousArrears
        ) +
        Math.max(
          0,
          monthlyPrice
        );

      const paymentAmount =
        Number(payment.amount || 0);

      if (paymentAmount <= 0) {
        throw new Error(
          'Payment amount درست نہیں ہے۔'
        );
      }

      /*
        Do not allow negative outstanding.
        If user paid more than calculated
        outstanding, remaining becomes zero.
      */

      const newRemaining =
        Math.max(
          0,
          totalDue -
            paymentAmount
        );

      /* =====================================================
         STEP 3
         CHECK COLLECTION DUPLICATE

         transaction_id is saved as receipt/reference
      ===================================================== */

      const transactionReference =
        payment.transaction_id ||
        `ONLINE-${payment.id}`;

      const {
        data: existingCollection,
        error: duplicateError
      } = await supabase
        .from('collections')
        .select('id')
        .eq(
          'receipt_number',
          transactionReference
        )
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (existingCollection) {
        throw new Error(
          'اس Transaction کی collection پہلے سے موجود ہے۔'
        );
      }

      /* =====================================================
         STEP 4
         INSERT INTO COLLECTIONS

         IMPORTANT:
         This is what makes Online Payment
         appear inside Income Report.
      ===================================================== */

      const {
        error: insertError
      } = await supabase
        .from('collections')
        .insert([
          {
            customer_id:
              payment.customer_id,

            previous_arrears:
              previousArrears,

            current_bill:
              monthlyPrice,

            total_amount:
              totalDue,

            paid_amount:
              paymentAmount,

            remaining_balance:
              newRemaining,

            payment_date:
              new Date().toISOString(),

            /*
              Online bill payment is
              monthly income.
            */
            income_category:
              'monthly_charges',

            /*
              Accounting report knows
              it came through online payment.
            */
            payment_method:
              'online',

            receipt_number:
              transactionReference,

            payment_note:
              `Online payment approved. Method: ${
                payment.payment_method ||
                'Online'
              }`
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      /* =====================================================
         STEP 5
         MARK ONLINE PAYMENT APPROVED
      ===================================================== */

      const {
        error: approveError
      } = await supabase
        .from('online_payments')
        .update({
          status: 'approved'
        })
        .eq('id', payment.id)
        .eq('status', 'pending');

      if (approveError) {
        throw approveError;
      }

      /* =====================================================
         STEP 6
         WHATSAPP
      ===================================================== */

      const targetPhone =
        payment.customers?.whatsapp ||
        payment.customers?.phone;

      if (targetPhone) {
        const approvedMsg =
`🌐 *ONE CLICK - HAIDER FIBER NETWORK* 🌐

✅ *آن لائن پیمنٹ منظور ہو گئی*

محترم *${payment.customers?.full_name || 'صارف'}*!

آپ کی آن لائن بل ادائیگی کامیابی سے verify کر دی گئی ہے۔

━━━━━━━━━━━━━━
🧾 *Payment Details*
━━━━━━━━━━━━━━

🆔 *Customer ID:* ${payment.customers?.serial_number || '-'}

💳 *طریقہ ادائیگی:* ${payment.payment_method || 'Online'}

🔖 *Transaction ID:* ${payment.transaction_id || '-'}

💰 *منظور شدہ رقم:* Rs ${paymentAmount.toLocaleString()}

🔻 *بقیہ واجبات:* Rs ${newRemaining.toLocaleString()}

📌 *Status:* APPROVED

━━━━━━━━━━━━━━

آپ کی ادائیگی کا شکریہ ❤️

*One Click*
*Haider Fiber Network (SMC-Private) Limited*
Your Network Solution`;

        try {
          openWhatsAppDirect(
            targetPhone,
            approvedMsg
          );
        } catch (whatsappError) {
          console.error(
            'WhatsApp Error:',
            whatsappError
          );
        }
      }

      await fetchPayments();

    } catch (err: any) {
      console.error(
        'Approve Payment Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'پیمنٹ approve نہیں ہو سکی۔'
      );

      alert(
        'خرابی: ' +
          (err?.message ||
            'Unknown error')
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     REJECT PAYMENT
  ========================================================= */

  const handleReject = async (
    payment: PaymentType
  ) => {
    if (
      payment.status !== 'pending'
    ) {
      return;
    }

    const confirmed = window.confirm(
      'کیا آپ اس آن لائن پیمنٹ کو Reject کرنا چاہتے ہیں؟'
    );

    if (!confirmed) return;

    setActionLoading(payment.id);
    setErrorMessage('');

    try {
      const {
        error
      } = await supabase
        .from('online_payments')
        .update({
          status: 'rejected'
        })
        .eq('id', payment.id)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      /* =====================================================
         WHATSAPP REJECTION
      ===================================================== */

      const targetPhone =
        payment.customers?.whatsapp ||
        payment.customers?.phone;

      if (targetPhone) {
        const rejectedMsg =
`🌐 *ONE CLICK - HAIDER FIBER NETWORK* 🌐

❌ *آن لائن پیمنٹ Reject کر دی گئی*

محترم *${payment.customers?.full_name || 'صارف'}*!

آپ کی بھیجی گئی آن لائن پیمنٹ verify نہیں ہو سکی۔

━━━━━━━━━━━━━━

🔖 *Transaction ID:* ${payment.transaction_id || '-'}

💰 *رقم:* Rs ${Number(
          payment.amount || 0
        ).toLocaleString()}

📌 *Status:* REJECTED

━━━━━━━━━━━━━━

براہِ کرم Transaction ID اور رسید دوبارہ چیک کریں اور ضرورت پڑنے پر نئی Payment Request بھیجیں۔

*One Click*
*Haider Fiber Network (SMC-Private) Limited*
Your Network Solution`;

        try {
          openWhatsAppDirect(
            targetPhone,
            rejectedMsg
          );
        } catch (whatsappError) {
          console.error(
            'WhatsApp Error:',
            whatsappError
          );
        }
      }

      await fetchPayments();

    } catch (err: any) {
      console.error(
        'Reject Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'Payment reject نہیں ہو سکی۔'
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '-';

    return new Date(
      date
    ).toLocaleString('en-GB');
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
          gap: '14px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#081a2c,#0b2035 55%,#09283a)',
            border: '1px solid #164e63',
            padding: '16px',
            borderRadius: '17px',
            display: 'flex',
            alignItems: 'center',
            gap: '11px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              background:
                'rgba(59,130,246,.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Globe size={23} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '17px',
                color: '#f8fafc',
                fontWeight: '800'
              }}
            >
              آن لائن پیمنٹ ویریفیکیشن
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                color: '#64748b',
                fontSize: '10px'
              }}
            >
              Online Payments • One Click
            </p>
          </div>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(239,68,68,.10)',
              border:
                '1px solid rgba(239,68,68,.45)',
              color: '#f87171',
              padding: '11px',
              borderRadius: '10px',
              display: 'flex',
              gap: '7px',
              alignItems: 'center',
              fontSize: '11px'
            }}
          >
            <AlertCircle size={15} />
            {errorMessage}
          </div>
        )}

        {/* COUNTERS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(150px,1fr))',
            gap: '9px'
          }}
        >
          <CounterCard
            title="Pending"
            value={counters.pending}
            color="#fbbf24"
            icon={<Clock size={18} />}
          />

          <CounterCard
            title="Approved"
            value={counters.approved}
            color="#34d399"
            icon={
              <CheckCircle2 size={18} />
            }
          />

          <CounterCard
            title="Rejected"
            value={counters.rejected}
            color="#f87171"
            icon={<XCircle size={18} />}
          />
        </div>

        {/* FILTER */}

        <div
          style={{
            background: '#0b1b2e',
            border: '1px solid #183a55',
            borderRadius: '13px',
            padding: '11px',
            display: 'flex',
            gap: '8px',
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
              placeholder="نام، Customer ID، Username یا Transaction..."
              value={searchTerm}
              onChange={e =>
                setSearchTerm(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#071525',
                border:
                  '1px solid #1e4663',
                color: '#ffffff',
                borderRadius: '9px',
                padding:
                  '9px 34px 9px 10px',
                fontSize: '11px',
                outline: 'none'
              }}
            />

            <Search
              size={14}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                color: '#64748b'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(
                e.target.value as any
              )
            }
            style={{
              background: '#071525',
              border:
                '1px solid #1e4663',
              color: '#ffffff',
              borderRadius: '9px',
              padding: '9px 10px',
              fontSize: '11px'
            }}
          >
            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="all">
              All
            </option>
          </select>

          <button
            type="button"
            onClick={fetchPayments}
            style={{
              background: '#071525',
              border:
                '1px solid #1e4663',
              color: '#38bdf8',
              padding: '9px 13px',
              borderRadius: '9px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: '700'
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

            Refresh
          </button>
        </div>

        {/* TABLE */}

        <div
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border:
              '1px solid #183a55',
            borderRadius: '15px',
            padding: '12px',
            overflowX: 'auto'
          }}
        >
          {fetching ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#22d3ee'
              }}
            >
              <Loader2
                size={22}
                className="animate-spin"
              />
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
                    background: '#071525',
                    color: '#94a3b8'
                  }}
                >
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>صارف</th>
                  <th style={thStyle}>تاریخ</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Transaction ID</th>
                  <th style={thStyle}>Receipt</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: '25px',
                        textAlign: 'center',
                        color: '#64748b'
                      }}
                    >
                      کوئی payment موجود نہیں۔
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(
                    (payment, index) => (
                      <tr
                        key={payment.id}
                        style={{
                          borderBottom:
                            '1px solid #14283c'
                        }}
                      >
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              color: '#ffffff',
                              fontWeight: '800'
                            }}
                          >
                            {payment.customers
                              ?.full_name ||
                              'Unknown'}
                          </div>

                          <div
                            style={{
                              color: '#38bdf8',
                              fontSize: '9px'
                            }}
                          >
                            {payment.customers
                              ?.serial_number ||
                              payment.customers
                                ?.pppoe_username ||
                              '-'}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            payment.created_at
                          )}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              color: '#c4b5fd'
                            }}
                          >
                            {payment.payment_method ||
                              'Online'}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: '#f472b6',
                            direction: 'ltr'
                          }}
                        >
                          {payment.transaction_id ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          {payment.receipt_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReceipt(
                                  payment.receipt_url ||
                                    null
                                )
                              }
                              style={{
                                background:
                                  'rgba(59,130,246,.12)',
                                border:
                                  '1px solid rgba(59,130,246,.30)',
                                color: '#60a5fa',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '9px'
                              }}
                            >
                              <Eye size={11} />
                              View
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: '#34d399',
                            fontWeight: '900'
                          }}
                        >
                          Rs{' '}
                          {Number(
                            payment.amount || 0
                          ).toLocaleString()}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            status={
                              payment.status
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          {payment.status ===
                          'pending' ? (
                            <div
                              style={{
                                display: 'flex',
                                gap: '5px'
                              }}
                            >
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  payment.id
                                }
                                onClick={() =>
                                  handleApprove(
                                    payment
                                  )
                                }
                                style={{
                                  background:
                                    '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius:
                                    '6px',
                                  padding:
                                    '6px 8px',
                                  fontSize:
                                    '9px',
                                  fontWeight:
                                    '800',
                                  cursor:
                                    'pointer',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '4px'
                                }}
                              >
                                {actionLoading ===
                                payment.id ? (
                                  <Loader2
                                    size={11}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={11}
                                  />
                                )}

                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  payment.id
                                }
                                onClick={() =>
                                  handleReject(
                                    payment
                                  )
                                }
                                style={{
                                  background:
                                    'rgba(239,68,68,.12)',
                                  color: '#f87171',
                                  border:
                                    '1px solid rgba(239,68,68,.35)',
                                  borderRadius:
                                    '6px',
                                  padding:
                                    '6px 8px',
                                  fontSize:
                                    '9px',
                                  cursor:
                                    'pointer',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '4px'
                                }}
                              >
                                <XCircle
                                  size={11}
                                />

                                Reject
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: '#64748b',
                                fontSize: '9px'
                              }}
                            >
                              Completed
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
              zIndex: 9999,
              background:
                'rgba(0,0,0,.80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e =>
                e.stopPropagation()
              }
              style={{
                width: '100%',
                maxWidth: '600px',
                background: '#0b1b2e',
                border:
                  '1px solid #164e63',
                borderRadius: '16px',
                padding: '12px'
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
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Receipt size={14} />
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
                    background:
                      'rgba(239,68,68,.15)',
                    border:
                      '1px solid rgba(239,68,68,.30)',
                    color: '#f87171',
                    borderRadius: '7px',
                    padding: '5px 8px',
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={15} />
                </button>
              </div>

              <img
                src={selectedReceipt}
                alt="Payment Receipt"
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* =========================================================
   COUNTER CARD
========================================================= */

function CounterCard({
  title,
  value,
  color,
  icon
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#0b1b2e',
        border: '1px solid #183a55',
        borderRadius: '11px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          background: `${color}18`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
            fontSize: '16px',
            fontWeight: '900'
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status
}: {
  status: PaymentType['status'];
}) {
  if (status === 'approved') {
    return (
      <span
        style={{
          color: '#34d399',
          background:
            'rgba(16,185,129,.12)',
          border:
            '1px solid rgba(16,185,129,.30)',
          padding: '3px 7px',
          borderRadius: '10px',
          fontSize: '9px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <CheckCircle2 size={10} />
        Approved
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        style={{
          color: '#f87171',
          background:
            'rgba(239,68,68,.12)',
          border:
            '1px solid rgba(239,68,68,.30)',
          padding: '3px 7px',
          borderRadius: '10px',
          fontSize: '9px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <XCircle size={10} />
        Rejected
      </span>
    );
  }

  return (
    <span
      style={{
        color: '#fbbf24',
        background:
          'rgba(245,158,11,.12)',
        border:
          '1px solid rgba(245,158,11,.30)',
        padding: '3px 7px',
        borderRadius: '10px',
        fontSize: '9px',
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

const thStyle: React.CSSProperties = {
  padding: '9px',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '9px',
  color: '#cbd5e1',
  whiteSpace: 'nowrap'
};