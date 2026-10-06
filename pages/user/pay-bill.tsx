import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';

import {
  CreditCard,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  QrCode,
  User,
  Wifi,
  Receipt,
  Clock,
  Wallet,
  History,
  Banknote,
  CalendarDays,
  Hash,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

// ===========================================================
// TYPES
// ===========================================================

interface CustomerType {
  id: number;
  serial_number?: string;
  full_name: string;
  pppoe_username: string;
  phone?: string;
  whatsapp?: string;
  package_name?: string;
  speed?: string;
  monthly_price: number;
  connection_charges?: number;
}

interface BillingStats {
  monthlyBill: number;
  previousArrears: number;
  totalDue: number;
  totalPaid: number;
}

type PaymentMethod =
  | 'easypaisa'
  | 'jazzcash'
  | 'raast'
  | 'sadapay'
  | 'nayapay';

interface PaymentHistoryItem {
  uniqueId: string;

  source:
    | 'collection'
    | 'online';

  amount: number;

  paymentMethod: string;

  transactionId: string;

  status: string;

  paymentDate: string;

  receiptUrl?: string | null;

  isReversed?: boolean;

  reversedAt?: string | null;

  reversalReason?: string | null;
}

// ===========================================================
// PAGE
// ===========================================================

export default function PayBillPage() {
  const [customer, setCustomer] =
    useState<CustomerType | null>(null);

  const [billingStats, setBillingStats] =
    useState<BillingStats>({
      monthlyBill: 0,
      previousArrears: 0,
      totalDue: 0,
      totalPaid: 0
    });

  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistoryItem[]>([]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('easypaisa');

  const [transactionId, setTransactionId] =
    useState('');

  const [amountPaid, setAmountPaid] =
    useState('');

  const [receiptImage, setReceiptImage] =
    useState<File | null>(null);

  const [receiptBase64, setReceiptBase64] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [compressing, setCompressing] =
    useState(false);

  const [successMsg, setSuccessMsg] =
    useState('');

  const [errorMsg, setErrorMsg] =
    useState('');

  const [pendingPayment, setPendingPayment] =
    useState(false);

  // =========================================================
  // PAYMENT DETAILS
  // =========================================================

  const paymentDetails: Record<
    PaymentMethod,
    {
      title: string;
      accountTitle: string;
      accountNumber: string;
      note: string;
    }
  > = {
    easypaisa: {
      title: 'Easypaisa',
      accountTitle: 'Asmatullah',
      accountNumber: '03457361106',

      note:
        'Easypaisa پر رقم بھیجنے کے بعد Transaction ID درج کریں یا رسید اپ لوڈ کریں۔'
    },

    jazzcash: {
      title: 'JazzCash',
      accountTitle: 'Asmatullah',
      accountNumber: '03067303029',

      note:
        'JazzCash پر رقم بھیجنے کے بعد Transaction ID درج کریں یا رسید اپ لوڈ کریں۔'
    },

    raast: {
      title: 'Raast ID',
      accountTitle: 'Asmatullah',
      accountNumber: '03067303029',

      note:
        'Raast ID پر رقم بھیجنے کے بعد Transaction ID درج کریں یا رسید اپ لوڈ کریں۔'
    },

    sadapay: {
      title: 'SadaPay',
      accountTitle: 'Asmatullah',
      accountNumber: '03067311162',

      note:
        'SadaPay پر رقم بھیجنے کے بعد Transaction ID درج کریں یا رسید اپ لوڈ کریں۔'
    },

    nayapay: {
      title: 'NayaPay',
      accountTitle: 'Asmatullah',
      accountNumber: '03067311162',

      note:
        'NayaPay پر رقم بھیجنے کے بعد Transaction ID درج کریں یا رسید اپ لوڈ کریں۔'
    }
  };

  // =========================================================
  // LOAD BILLING DATA
  // =========================================================

  const loadBillingData = async () => {
    setPageLoading(true);
    setErrorMsg('');

    try {
      // =====================================================
      // LOGIN USER
      // =====================================================

      const storedUser =
        localStorage.getItem('user');

      if (!storedUser) {
        throw new Error(
          'صارف کی Login معلومات نہیں ملیں۔ دوبارہ Login کریں۔'
        );
      }

      const parsedUser =
        JSON.parse(storedUser);

      const customerId =
        parsedUser.id ||
        parsedUser.customer_id;

      if (!customerId) {
        throw new Error(
          'Customer ID نہیں ملی۔'
        );
      }

      // =====================================================
      // CUSTOMER
      // =====================================================

      const {
        data: custData,
        error: custError
      } = await supabase
        .from('customers')
        .select(`
          id,
          serial_number,
          full_name,
          pppoe_username,
          phone,
          whatsapp,
          package_name,
          speed,
          monthly_price,
          connection_charges
        `)
        .eq('id', customerId)
        .single();

      if (custError) {
        throw custError;
      }

      if (!custData) {
        throw new Error(
          'Customer record نہیں ملا۔'
        );
      }

      // =====================================================
      // COLLECTIONS
      //
      // IMPORTANT:
      // Reverse Payment columns بھی load ہو رہے ہیں
      // =====================================================

      const {
        data: collections,
        error: collectionsError
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
          income_category,
          payment_method,
          payment_note,
          receipt_number,
          is_reversed,
          reversed_at,
          reversal_reason
        `)
        .eq('customer_id', customerId)
        .order('id', {
          ascending: false
        });

      if (collectionsError) {
        throw collectionsError;
      }

      // =====================================================
      // ONLINE PAYMENTS
      // =====================================================

      const {
        data: onlinePayments,
        error: onlineError
      } = await supabase
        .from('online_payments')
        .select(`
          id,
          customer_id,
          amount,
          payment_method,
          transaction_id,
          receipt_url,
          status,
          created_at
        `)
        .eq('customer_id', customerId)
        .order('created_at', {
          ascending: false
        });

      if (onlineError) {
        throw onlineError;
      }

      // =====================================================
      // VALID COLLECTIONS
      //
      // Reversed collections یہاں سے مکمل exclude ہوں گی
      // =====================================================

      const validCollections =
        (collections || []).filter(
          (item: any) =>
            item.is_reversed !== true
        );

      // =====================================================
      // TOTAL PAID
      //
      // صرف NON-REVERSED payments
      // =====================================================

      const paidSum =
        validCollections.reduce(
          (
            sum: number,
            item: any
          ) =>
            sum +
            Number(
              item.paid_amount || 0
            ),
          0
        );

      // =====================================================
      // CUSTOMER BILL
      // =====================================================

      const monthlyBill =
        Number(
          custData.monthly_price || 0
        );

      const connectionCharges =
        Number(
          custData.connection_charges || 0
        );

      let totalDue = 0;
      let previousArrears = 0;

      // =====================================================
      // BALANCE CALCULATION
      //
      // صرف آخری valid/non-reversed collection استعمال ہوگی
      // =====================================================

      if (
        validCollections.length > 0
      ) {
        const latestValidCollection =
          validCollections[0];

        totalDue =
          Math.max(
            0,
            Number(
              latestValidCollection
                .remaining_balance || 0
            )
          );

        previousArrears =
          Math.max(
            0,
            totalDue - monthlyBill
          );
      } else {
        // ===================================================
        // اگر کوئی valid collection باقی نہیں
        // یعنی:
        // 1) کبھی payment نہیں ہوئی
        // یا
        // 2) تمام payments reverse ہو چکی ہیں
        //
        // Initial bill واپس show ہوگا
        // ===================================================

        previousArrears =
          connectionCharges;

        totalDue =
          connectionCharges +
          monthlyBill;
      }

      // =====================================================
      // PENDING ONLINE PAYMENT
      // =====================================================

      const hasPending =
        (onlinePayments || []).some(
          (item: any) =>
            String(
              item.status || ''
            ).toLowerCase() ===
            'pending'
        );

      setPendingPayment(
        hasPending
      );

      // =====================================================
      // COLLECTION HISTORY
      //
      // Reversed records delete نہیں ہوں گے۔
      // History میں REVERSED دکھیں گے۔
      // =====================================================

      const collectionHistory:
        PaymentHistoryItem[] =
        (collections || [])
          .filter(
            (item: any) =>
              Number(
                item.paid_amount || 0
              ) > 0
          )
          .map(
            (item: any) => {
              const reversed =
                item.is_reversed === true;

              return {
                uniqueId:
                  `collection-${item.id}`,

                source:
                  'collection' as const,

                amount:
                  Number(
                    item.paid_amount || 0
                  ),

                paymentMethod:
                  item.payment_method ||
                  'cash',

                transactionId:
                  item.receipt_number ||
                  `COL-${item.id}`,

                status:
                  reversed
                    ? 'reversed'
                    : 'paid',

                paymentDate:
                  item.payment_date ||
                  '',

                receiptUrl:
                  null,

                isReversed:
                  reversed,

                reversedAt:
                  item.reversed_at ||
                  null,

                reversalReason:
                  item.reversal_reason ||
                  null
              };
            }
          );

      // =====================================================
      // ONLINE PAYMENT HISTORY
      // =====================================================

      const onlineHistory:
        PaymentHistoryItem[] =
        (onlinePayments || []).map(
          (item: any) => ({
            uniqueId:
              `online-${item.id}`,

            source:
              'online' as const,

            amount:
              Number(
                item.amount || 0
              ),

            paymentMethod:
              item.payment_method ||
              'online',

            transactionId:
              item.transaction_id ||
              '-',

            status:
              item.status ||
              'pending',

            paymentDate:
              item.created_at ||
              '',

            receiptUrl:
              item.receipt_url ||
              null,

            isReversed:
              false,

            reversedAt:
              null,

            reversalReason:
              null
          })
        );

      // =====================================================
      // MERGE HISTORY
      // =====================================================

      const mergedHistory = [
        ...collectionHistory,
        ...onlineHistory
      ].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.paymentDate
            ).getTime();

          const dateB =
            new Date(
              b.paymentDate
            ).getTime();

          return dateB - dateA;
        }
      );

      // =====================================================
      // SET STATE
      // =====================================================

      setPaymentHistory(
        mergedHistory
      );

      setCustomer(
        custData as CustomerType
      );

      setBillingStats({
        monthlyBill,
        previousArrears,
        totalDue,
        totalPaid:
          paidSum
      });

      setAmountPaid(
        totalDue > 0
          ? String(totalDue)
          : ''
      );
    } catch (err: any) {
      console.error(
        'Billing load error:',
        err
      );

      setErrorMsg(
        err?.message ||
          'بل کی معلومات لوڈ نہیں ہو سکیں۔'
      );
    } finally {
      setPageLoading(
        false
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadBillingData();
  }, []);

  // =========================================================
  // IMAGE COMPRESSION
  // =========================================================

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      setErrorMsg(
        'صرف تصویر اپ لوڈ کریں۔'
      );

      return;
    }

    setCompressing(true);
    setErrorMsg('');

    const reader =
      new FileReader();

    reader.readAsDataURL(
      file
    );

    reader.onload = (
      event
    ) => {
      const img =
        new Image();

      img.src =
        event.target
          ?.result as string;

      img.onload = () => {
        let width =
          img.width;

        let height =
          img.height;

        const maxWidth =
          500;

        if (
          width > maxWidth
        ) {
          height =
            Math.round(
              (height *
                maxWidth) /
                width
            );

          width =
            maxWidth;
        }

        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width =
          width;

        canvas.height =
          height;

        const ctx =
          canvas.getContext(
            '2d'
          );

        if (!ctx) {
          setCompressing(
            false
          );

          setErrorMsg(
            'تصویر process نہیں ہو سکی۔'
          );

          return;
        }

        ctx.fillStyle =
          '#ffffff';

        ctx.fillRect(
          0,
          0,
          width,
          height
        );

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        let quality =
          0.65;

        let compressedDataUrl =
          canvas.toDataURL(
            'image/jpeg',
            quality
          );

        while (
          compressedDataUrl.length >
            20000 &&
          quality > 0.15
        ) {
          quality -=
            0.05;

          compressedDataUrl =
            canvas.toDataURL(
              'image/jpeg',
              quality
            );
        }

        setReceiptBase64(
          compressedDataUrl
        );

        setReceiptImage(
          file
        );

        setCompressing(
          false
        );
      };

      img.onerror = () => {
        setCompressing(
          false
        );

        setErrorMsg(
          'تصویر پڑھنے میں خرابی پیش آئی۔'
        );
      };
    };

    reader.onerror = () => {
      setCompressing(
        false
      );

      setErrorMsg(
        'فائل پڑھنے میں خرابی پیش آئی۔'
      );
    };
  };

  // =========================================================
  // SUBMIT PAYMENT
  // =========================================================

  const handleSubmitPayment =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (!customer) {
        setErrorMsg(
          'Customer record موجود نہیں ہے۔'
        );

        return;
      }

      if (
        pendingPayment
      ) {
        setErrorMsg(
          'آپ کی ایک پیمنٹ پہلے ہی Verification کے لیے Pending ہے۔ ایڈمن کی تصدیق کا انتظار کریں۔'
        );

        return;
      }

      const numericAmount =
        Number(
          amountPaid
        );

      if (
        !numericAmount ||
        numericAmount <= 0
      ) {
        setErrorMsg(
          'درست رقم درج کریں۔'
        );

        return;
      }

      if (
        numericAmount >
        billingStats.totalDue
      ) {
        setErrorMsg(
          `آپ کے کل واجبات Rs ${billingStats.totalDue.toLocaleString()} ہیں۔ اس سے زیادہ رقم submit نہیں کی جا سکتی۔`
        );

        return;
      }

      if (
        !transactionId.trim() &&
        !receiptBase64
      ) {
        setErrorMsg(
          'براہِ کرم Transaction ID درج کریں یا رسید کی تصویر اپ لوڈ کریں۔'
        );

        return;
      }

      setLoading(
        true
      );

      setErrorMsg('');
      setSuccessMsg('');

      try {
        // ===================================================
        // DOUBLE SUBMIT CHECK
        // ===================================================

        const {
          data:
            existingPending,

          error:
            pendingCheckError
        } = await supabase
          .from(
            'online_payments'
          )
          .select(
            'id'
          )
          .eq(
            'customer_id',
            customer.id
          )
          .eq(
            'status',
            'pending'
          )
          .limit(1);

        if (
          pendingCheckError
        ) {
          throw pendingCheckError;
        }

        if (
          existingPending &&
          existingPending.length >
            0
        ) {
          setPendingPayment(
            true
          );

          throw new Error(
            'آپ کی ایک پیمنٹ پہلے ہی Pending ہے۔'
          );
        }

        // ===================================================
        // SAVE ONLINE PAYMENT
        // ===================================================

        const {
          error:
            insertError
        } = await supabase
          .from(
            'online_payments'
          )
          .insert([
            {
              customer_id:
                customer.id,

              amount:
                numericAmount,

              payment_method:
                paymentMethod,

              transaction_id:
                transactionId.trim() ||
                'RECEIPT-UPLOADED',

              receipt_url:
                receiptBase64 ||
                null,

              status:
                'pending'
            }
          ]);

        if (
          insertError
        ) {
          throw insertError;
        }

        setPendingPayment(
          true
        );

        setSuccessMsg(
          'آپ کی پیمنٹ کامیابی سے Verification کے لیے بھیج دی گئی ہے۔ تصدیق کے بعد بقایا خودکار طور پر اپڈیٹ ہو جائے گا۔'
        );

        setTransactionId(
          ''
        );

        setReceiptBase64(
          ''
        );

        setReceiptImage(
          null
        );

        await loadBillingData();
      } catch (
        err: any
      ) {
        console.error(
          'Payment submit error:',
          err
        );

        setErrorMsg(
          err?.message ||
            'پیمنٹ بھیجنے میں خرابی پیش آئی۔'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // =========================================================
  // PAID HISTORY TOTAL
  //
  // Reversed payments count نہیں ہوں گی
  // Pending/Rejected بھی count نہیں ہوں گی
  // =========================================================

  const historyPaidTotal =
    useMemo(() => {
      return paymentHistory
        .filter(
          item =>
            !item.isReversed &&
            normalizeStatus(
              item.status
            ) === 'paid'
        )
        .reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount || 0
            ),
          0
        );
    }, [
      paymentHistory
    ]);

  // =========================================================
  // LOADING
  // =========================================================

  if (
    pageLoading
  ) {
    return (
      <Layout
        showNavButtons={
          false
        }
      >
        <div
          style={{
            minHeight:
              '300px',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            flexDirection:
              'column',

            gap:
              '10px',

            color:
              '#38bdf8'
          }}
        >
          <Loader2
            size={28}
            className="animate-spin"
          />

          <span
            style={{
              fontSize:
                '12px'
            }}
          >
            بل اور ادائیگیوں کی معلومات لوڈ ہو رہی ہیں...
          </span>
        </div>
      </Layout>
    );
  }

  const selectedPayment =
    paymentDetails[
      paymentMethod
    ];

  // =========================================================
  // PAGE UI
  // =========================================================

  return (
    <Layout
      showNavButtons={
        false
      }
    >
      <div
        style={{
          display:
            'flex',

          flexDirection:
            'column',

          gap:
            '16px',

          width:
            '100%',

          maxWidth:
            '850px',

          margin:
            '0 auto'
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#10253e,#0b1e33)',

            border:
              '1px solid #10b981',

            padding:
              '14px 16px',

            borderRadius:
              '15px',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'space-between',

            gap:
              '10px'
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '10px'
            }}
          >
            <div
              style={{
                backgroundColor:
                  'rgba(16,185,129,0.18)',

                padding:
                  '9px',

                borderRadius:
                  '10px',

                color:
                  '#34d399'
              }}
            >
              <CreditCard
                size={21}
              />
            </div>

            <div>
              <h2
                style={{
                  margin:
                    0,

                  fontSize:
                    '16px',

                  color:
                    '#ffffff',

                  fontWeight:
                    '900'
                }}
              >
                آن لائن بل ادائیگی
              </h2>

              <p
                style={{
                  margin:
                    '3px 0 0',

                  fontSize:
                    '10px',

                  color:
                    '#93c5fd'
                }}
              >
                ONE CLICK • HAIDER FIBER NETWORK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadBillingData()
            }
            style={{
              width:
                '36px',

              height:
                '36px',

              borderRadius:
                '10px',

              border:
                '1px solid #334155',

              backgroundColor:
                '#0f172a',

              color:
                '#38bdf8',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              cursor:
                'pointer'
            }}
            title="Refresh"
          >
            <RefreshCw
              size={16}
            />
          </button>
        </div>

        {/* =================================================
            CUSTOMER INFO
        ================================================= */}

        {customer && (
          <div
            style={{
              backgroundColor:
                '#1c2541',

              border:
                '1px solid #334155',

              borderRadius:
                '14px',

              padding:
                '14px'
            }}
          >
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit,minmax(145px,1fr))',

                gap:
                  '10px'
              }}
            >
              <InfoBox
                icon={
                  <User
                    size={15}
                  />
                }
                title="صارف"
                value={
                  customer.full_name
                }
              />

              <InfoBox
                icon={
                  <Receipt
                    size={15}
                  />
                }
                title="HFN ID"
                value={
                  customer.serial_number ||
                  '---'
                }
              />

              <InfoBox
                icon={
                  <Wifi
                    size={15}
                  />
                }
                title="PPPoE"
                value={
                  customer.pppoe_username
                }
              />

              <InfoBox
                icon={
                  <Wifi
                    size={15}
                  />
                }
                title="Package"
                value={`${
                  customer.package_name ||
                  '---'
                } • ${
                  customer.speed ||
                  '---'
                }`}
              />
            </div>
          </div>
        )}

        {/* =================================================
            BILL DETAILS
        ================================================= */}

        <div
          style={{
            backgroundColor:
              '#1c2541',

            border:
              '1px solid #334155',

            borderRadius:
              '14px',

            padding:
              '16px'
          }}
        >
          <h3
            style={{
              margin:
                '0 0 12px',

              fontSize:
                '13px',

              color:
                '#38bdf8',

              borderBottom:
                '1px solid #334155',

              paddingBottom:
                '8px'
            }}
          >
            واجبات و بل تفصیلات
          </h3>

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(auto-fit,minmax(140px,1fr))',

              gap:
                '10px'
            }}
          >
            <BillCard
              title="ماہانہ بل"
              value={
                billingStats.monthlyBill
              }
              color="#38bdf8"
            />

            <BillCard
              title="سابقہ بقایاجات"
              value={
                billingStats.previousArrears
              }
              color="#fbbf24"
            />

            <BillCard
              title="کل واجب الادا"
              value={
                billingStats.totalDue
              }
              color="#f87171"
            />

            <BillCard
              title="اب تک کل جمع"
              value={
                billingStats.totalPaid
              }
              color="#34d399"
            />
          </div>
        </div>

        {/* =================================================
            PENDING NOTICE
        ================================================= */}

        {pendingPayment && (
          <div
            style={{
              backgroundColor:
                'rgba(245,158,11,0.14)',

              border:
                '1px solid #f59e0b',

              color:
                '#fbbf24',

              padding:
                '12px',

              borderRadius:
                '11px',

              fontSize:
                '12px',

              display:
                'flex',

              gap:
                '8px',

              alignItems:
                'center'
            }}
          >
            <Clock
              size={17}
            />

            آپ کی ایک Online Payment Verification کے لیے Pending ہے۔
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {successMsg && (
          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.15)',

              border:
                '1px solid #10b981',

              color:
                '#34d399',

              padding:
                '12px',

              borderRadius:
                '10px',

              fontSize:
                '12px',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                '8px'
            }}
          >
            <CheckCircle2
              size={17}
            />

            {successMsg}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMsg && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',

              border:
                '1px solid #ef4444',

              color:
                '#f87171',

              padding:
                '12px',

              borderRadius:
                '10px',

              fontSize:
                '12px',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                '8px'
            }}
          >
            <AlertCircle
              size={17}
            />

            {errorMsg}
          </div>
        )}

        {/* =================================================
            PAYMENT FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmitPayment
          }
          style={{
            backgroundColor:
              '#1c2541',

            border:
              '1px solid #334155',

            borderRadius:
              '14px',

            padding:
              '16px',

            display:
              'flex',

            flexDirection:
              'column',

            gap:
              '14px'
          }}
        >
          <h3
            style={{
              margin:
                0,

              fontSize:
                '13px',

              color:
                '#38bdf8'
            }}
          >
            ادائیگی کا طریقہ منتخب کریں
          </h3>

          {/* =================================================
              PAYMENT METHODS
          ================================================= */}

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(auto-fit,minmax(115px,1fr))',

              gap:
                '8px'
            }}
          >
            <PaymentButton
              active={
                paymentMethod ===
                'easypaisa'
              }
              title="Easypaisa"
              color="#10b981"
              icon={
                <Smartphone
                  size={19}
                />
              }
              onClick={() =>
                setPaymentMethod(
                  'easypaisa'
                )
              }
            />

            <PaymentButton
              active={
                paymentMethod ===
                'jazzcash'
              }
              title="JazzCash"
              color="#ef4444"
              icon={
                <Smartphone
                  size={19}
                />
              }
              onClick={() =>
                setPaymentMethod(
                  'jazzcash'
                )
              }
            />

            <PaymentButton
              active={
                paymentMethod ===
                'raast'
              }
              title="Raast ID"
              color="#f59e0b"
              icon={
                <QrCode
                  size={19}
                />
              }
              onClick={() =>
                setPaymentMethod(
                  'raast'
                )
              }
            />

            <PaymentButton
              active={
                paymentMethod ===
                'sadapay'
              }
              title="SadaPay"
              color="#8b5cf6"
              icon={
                <Wallet
                  size={19}
                />
              }
              onClick={() =>
                setPaymentMethod(
                  'sadapay'
                )
              }
            />

            <PaymentButton
              active={
                paymentMethod ===
                'nayapay'
              }
              title="NayaPay"
              color="#3b82f6"
              icon={
                <Wallet
                  size={19}
                />
              }
              onClick={() =>
                setPaymentMethod(
                  'nayapay'
                )
              }
            />
          </div>

          {/* =================================================
              ACCOUNT DETAILS
          ================================================= */}

          <div
            style={{
              backgroundColor:
                '#0f172a',

              border:
                '1px solid #334155',

              borderLeft:
                '3px solid #38bdf8',

              padding:
                '13px',

              borderRadius:
                '9px'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                gap:
                  '10px'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      '13px',

                    fontWeight:
                      '900',

                    color:
                      '#ffffff'
                  }}
                >
                  {
                    selectedPayment.title
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      '5px',

                    fontSize:
                      '11px',

                    color:
                      '#94a3b8'
                  }}
                >
                  Account Title:{' '}

                  <strong
                    style={{
                      color:
                        '#ffffff'
                    }}
                  >
                    {
                      selectedPayment.accountTitle
                    }
                  </strong>
                </div>
              </div>

              <Wallet
                size={22}
                color="#38bdf8"
              />
            </div>

            <div
              style={{
                marginTop:
                  '9px',

                fontSize:
                  '17px',

                color:
                  '#38bdf8',

                direction:
                  'ltr',

                textAlign:
                  'left',

                fontWeight:
                  '900',

                letterSpacing:
                  '0.5px'
              }}
            >
              {
                selectedPayment.accountNumber
              }
            </div>

            <div
              style={{
                marginTop:
                  '8px',

                fontSize:
                  '10px',

                color:
                  '#64748b'
              }}
            >
              {
                selectedPayment.note
              }
            </div>
          </div>

          {/* =================================================
              AMOUNT
          ================================================= */}

          <div>
            <label
              style={
                labelStyle
              }
            >
              جمع کی جانے والی رقم (Rs) *
            </label>

            <input
              type="number"
              min="1"
              max={
                billingStats.totalDue ||
                undefined
              }
              value={
                amountPaid
              }
              onChange={
                e =>
                  setAmountPaid(
                    e.target.value
                  )
              }
              required
              disabled={
                pendingPayment ||
                billingStats.totalDue <=
                  0
              }
              style={
                inputStyle
              }
            />
          </div>

          {/* =================================================
              TRANSACTION ID
          ================================================= */}

          <div>
            <label
              style={
                labelStyle
              }
            >
              Transaction ID / TRX ID
            </label>

            <input
              type="text"
              placeholder="مثلاً: 9876543210"
              value={
                transactionId
              }
              onChange={
                e =>
                  setTransactionId(
                    e.target.value
                  )
              }
              disabled={
                pendingPayment
              }
              style={{
                ...inputStyle,

                direction:
                  'ltr'
              }}
            />
          </div>

          {/* =================================================
              RECEIPT
          ================================================= */}

          <div>
            <label
              style={
                labelStyle
              }
            >
              رسید کی تصویر
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageUpload
              }
              style={{
                display:
                  'none'
              }}
              id="receipt-upload"
              disabled={
                pendingPayment
              }
            />

            <label
              htmlFor="receipt-upload"
              style={{
                backgroundColor:
                  '#0f172a',

                border:
                  '1px dashed #3b82f6',

                color:
                  '#38bdf8',

                padding:
                  '12px',

                borderRadius:
                  '9px',

                fontSize:
                  '11px',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  '6px',

                cursor:
                  pendingPayment
                    ? 'not-allowed'
                    : 'pointer'
              }}
            >
              {compressing ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Upload
                  size={15}
                />
              )}

              {compressing
                ? 'تصویر Compress ہو رہی ہے...'
                : receiptImage
                  ? receiptImage.name
                  : 'رسید منتخب کریں'}
            </label>

            {receiptBase64 && (
              <div
                style={{
                  marginTop:
                    '10px'
                }}
              >
                <img
                  src={
                    receiptBase64
                  }
                  alt="Payment Receipt"
                  style={{
                    maxWidth:
                      '180px',

                    maxHeight:
                      '180px',

                    borderRadius:
                      '8px',

                    border:
                      '1px solid #334155',

                    objectFit:
                      'contain'
                  }}
                />

                <p
                  style={{
                    margin:
                      '4px 0 0',

                    fontSize:
                      '10px',

                    color:
                      '#34d399'
                  }}
                >
                  ✓ رسید تیار ہے
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            disabled={
              loading ||
              compressing ||
              pendingPayment ||
              billingStats.totalDue <=
                0
            }
            style={{
              backgroundColor:
                pendingPayment ||
                billingStats.totalDue <=
                  0
                  ? '#475569'
                  : '#10b981',

              color:
                '#ffffff',

              padding:
                '12px',

              borderRadius:
                '9px',

              border:
                'none',

              fontWeight:
                '900',

              fontSize:
                '12px',

              cursor:
                pendingPayment
                  ? 'not-allowed'
                  : 'pointer',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                '6px'
            }}
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send
                size={16}
              />
            )}

            {billingStats.totalDue <= 0
              ? 'آپ کا کوئی بقایا نہیں'
              : pendingPayment
                ? 'Verification Pending'
                : loading
                  ? 'ریکویسٹ بھیجی جا رہی ہے...'
                  : 'پیمنٹ ریکویسٹ ایڈمن کو بھیجیں'}
          </button>
        </form>

        {/* =================================================
            COMPLETE PAYMENT HISTORY
        ================================================= */}

        <div
          style={{
            backgroundColor:
              '#1c2541',

            border:
              '1px solid #334155',

            borderRadius:
              '14px',

            padding:
              '16px'
          }}
        >
          {/* HISTORY HEADER */}

          <div
            style={{
              display:
                'flex',

              justifyContent:
                'space-between',

              alignItems:
                'center',

              gap:
                '10px',

              borderBottom:
                '1px solid #334155',

              paddingBottom:
                '11px',

              marginBottom:
                '12px'
            }}
          >
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  '7px'
              }}
            >
              <History
                size={18}
                color="#38bdf8"
              />

              <div>
                <h3
                  style={{
                    margin:
                      0,

                    fontSize:
                      '14px',

                    color:
                      '#ffffff',

                    fontWeight:
                      '900'
                  }}
                >
                  مکمل ادائیگی ہسٹری
                </h3>

                <div
                  style={{
                    marginTop:
                      '3px',

                    fontSize:
                      '9px',

                    color:
                      '#94a3b8'
                  }}
                >
                  Cash + Online Payments + Reversed
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor:
                  '#0f172a',

                border:
                  '1px solid #10b981',

                borderRadius:
                  '9px',

                padding:
                  '7px 9px',

                textAlign:
                  'right'
              }}
            >
              <div
                style={{
                  fontSize:
                    '8px',

                  color:
                    '#94a3b8'
                }}
              >
                Valid Paid
              </div>

              <div
                style={{
                  fontSize:
                    '12px',

                  color:
                    '#34d399',

                  fontWeight:
                    '900'
                }}
              >
                Rs{' '}
                {historyPaidTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* =================================================
              HISTORY LIST
          ================================================= */}

          {paymentHistory.length ===
          0 ? (
            <div
              style={{
                backgroundColor:
                  '#0f172a',

                border:
                  '1px dashed #334155',

                borderRadius:
                  '10px',

                padding:
                  '25px 12px',

                textAlign:
                  'center',

                color:
                  '#64748b',

                fontSize:
                  '11px'
              }}
            >
              ابھی تک کوئی ادائیگی ریکارڈ موجود نہیں۔
            </div>
          ) : (
            <div
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  '10px'
              }}
            >
              {paymentHistory.map(
                item => (
                  <HistoryCard
                    key={
                      item.uniqueId
                    }
                    item={
                      item
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ===========================================================
// HISTORY CARD
// ===========================================================

function HistoryCard({
  item
}: {
  item: PaymentHistoryItem;
}) {
  const normalized =
    normalizeStatus(
      item.status
    );

  const statusInfo =
    getStatusInfo(
      normalized
    );

  const methodInfo =
    getMethodInfo(
      item.paymentMethod,
      item.source
    );

  const isReversed =
    item.isReversed === true ||
    normalized ===
      'reversed';

  return (
    <div
      style={{
        backgroundColor:
          '#0f172a',

        border:
          isReversed
            ? '1px solid rgba(239,68,68,0.65)'
            : '1px solid #334155',

        borderRadius:
          '12px',

        padding:
          '12px',

        opacity:
          isReversed
            ? 0.9
            : 1
      }}
    >
      {/* =====================================================
          TOP
      ===================================================== */}

      <div
        style={{
          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'space-between',

          gap:
            '10px'
        }}
      >
        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              '8px'
          }}
        >
          <div
            style={{
              width:
                '36px',

              height:
                '36px',

              borderRadius:
                '10px',

              backgroundColor:
                isReversed
                  ? 'rgba(239,68,68,0.12)'
                  : methodInfo.background,

              color:
                isReversed
                  ? '#f87171'
                  : methodInfo.color,

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center'
            }}
          >
            {isReversed ? (
              <RotateCcw
                size={18}
              />
            ) : item.source ===
              'collection' ? (
              <Banknote
                size={18}
              />
            ) : (
              <Smartphone
                size={18}
              />
            )}
          </div>

          <div>
            <div
              style={{
                color:
                  '#ffffff',

                fontSize:
                  '12px',

                fontWeight:
                  '900'
              }}
            >
              {
                methodInfo.label
              }
            </div>

            <div
              style={{
                color:
                  isReversed
                    ? '#f87171'
                    : '#64748b',

                fontSize:
                  '9px',

                marginTop:
                  '2px'
              }}
            >
              {isReversed
                ? 'Payment Reversed'
                : item.source ===
                    'collection'
                  ? 'Collection Payment'
                  : 'Online Payment'}
            </div>
          </div>
        </div>

        {/* AMOUNT + STATUS */}

        <div
          style={{
            textAlign:
              'right'
          }}
        >
          <div
            style={{
              color:
                isReversed
                  ? '#f87171'
                  : '#34d399',

              fontSize:
                '15px',

              fontWeight:
                '900',

              textDecoration:
                isReversed
                  ? 'line-through'
                  : 'none'
            }}
          >
            Rs{' '}
            {item.amount.toLocaleString()}
          </div>

          <span
            style={{
              display:
                'inline-block',

              marginTop:
                '4px',

              padding:
                '3px 7px',

              borderRadius:
                '20px',

              fontSize:
                '8px',

              fontWeight:
                '900',

              color:
                statusInfo.color,

              backgroundColor:
                statusInfo.background,

              border: `1px solid ${statusInfo.border}`
            }}
          >
            {
              statusInfo.label
            }
          </span>
        </div>
      </div>

      {/* =====================================================
          DETAILS
      ===================================================== */}

      <div
        style={{
          marginTop:
            '11px',

          paddingTop:
            '10px',

          borderTop:
            '1px solid #1e293b',

          display:
            'grid',

          gridTemplateColumns:
            'repeat(auto-fit,minmax(135px,1fr))',

          gap:
            '8px'
        }}
      >
        <HistoryDetail
          icon={
            <CalendarDays
              size={13}
            />
          }
          title="تاریخ"
          value={
            formatDate(
              item.paymentDate
            )
          }
        />

        <HistoryDetail
          icon={
            <Clock
              size={13}
            />
          }
          title="وقت"
          value={
            formatTime(
              item.paymentDate
            )
          }
        />

        <HistoryDetail
          icon={
            <Wallet
              size={13}
            />
          }
          title="طریقہ"
          value={
            methodInfo.label
          }
        />

        <HistoryDetail
          icon={
            <Hash
              size={13}
            />
          }
          title={
            item.source ===
            'collection'
              ? 'Receipt No'
              : 'Transaction ID'
          }
          value={
            item.transactionId ||
            '-'
          }
        />
      </div>

      {/* =====================================================
          REVERSAL INFORMATION
      ===================================================== */}

      {isReversed && (
        <div
          style={{
            marginTop:
              '11px',

            backgroundColor:
              'rgba(239,68,68,0.08)',

            border:
              '1px solid rgba(239,68,68,0.35)',

            borderRadius:
              '9px',

            padding:
              '10px'
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '6px',

              color:
                '#f87171',

              fontWeight:
                '900',

              fontSize:
                '10px'
            }}
          >
            <RotateCcw
              size={13}
            />

            یہ Payment Reverse کر دی گئی ہے
          </div>

          {item.reversalReason && (
            <div
              style={{
                marginTop:
                  '7px',

                fontSize:
                  '9px',

                color:
                  '#fca5a5'
              }}
            >
              <strong>
                وجہ:
              </strong>{' '}

              {
                item.reversalReason
              }
            </div>
          )}

          {item.reversedAt && (
            <div
              style={{
                marginTop:
                  '5px',

                fontSize:
                  '8px',

                color:
                  '#94a3b8'
              }}
            >
              Reverse Date:{' '}

              {
                formatDateTime(
                  item.reversedAt
                )
              }
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          RECEIPT
      ===================================================== */}

      {item.receiptUrl && (
        <div
          style={{
            marginTop:
              '10px'
          }}
        >
          <a
            href={
              item.receiptUrl
            }
            target="_blank"
            rel="noreferrer"
            style={{
              display:
                'inline-flex',

              alignItems:
                'center',

              gap:
                '5px',

              color:
                '#38bdf8',

              backgroundColor:
                'rgba(56,189,248,0.08)',

              border:
                '1px solid rgba(56,189,248,0.3)',

              padding:
                '6px 9px',

              borderRadius:
                '7px',

              textDecoration:
                'none',

              fontSize:
                '9px',

              fontWeight:
                'bold'
            }}
          >
            <Receipt
              size={12}
            />

            رسید دیکھیں
          </a>
        </div>
      )}
    </div>
  );
}

// ===========================================================
// HISTORY DETAIL
// ===========================================================

function HistoryDetail({
  icon,
  title,
  value
}: {
  icon:
    React.ReactNode;

  title:
    string;

  value:
    string;
}) {
  return (
    <div>
      <div
        style={{
          display:
            'flex',

          alignItems:
            'center',

          gap:
            '4px',

          color:
            '#64748b',

          fontSize:
            '8px'
        }}
      >
        {icon}

        {title}
      </div>

      <div
        style={{
          marginTop:
            '3px',

          color:
            '#cbd5e1',

          fontSize:
            '10px',

          fontWeight:
            'bold',

          wordBreak:
            'break-word'
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ===========================================================
// BILL CARD
// ===========================================================

function BillCard({
  title,
  value,
  color
}: {
  title:
    string;

  value:
    number;

  color:
    string;
}) {
  return (
    <div
      style={{
        backgroundColor:
          '#0f172a',

        padding:
          '11px',

        borderRadius:
          '9px',

        border:
          `1px solid ${color}`
      }}
    >
      <span
        style={{
          fontSize:
            '10px',

          color:
            '#94a3b8'
        }}
      >
        {title}
      </span>

      <h4
        style={{
          margin:
            '4px 0 0',

          fontSize:
            '16px',

          color,

          fontWeight:
            '900'
        }}
      >
        Rs{' '}

        {value.toLocaleString()}
      </h4>
    </div>
  );
}

// ===========================================================
// INFO BOX
// ===========================================================

function InfoBox({
  icon,
  title,
  value
}: {
  icon:
    React.ReactNode;

  title:
    string;

  value:
    string;
}) {
  return (
    <div
      style={{
        backgroundColor:
          '#0f172a',

        padding:
          '10px',

        borderRadius:
          '9px',

        border:
          '1px solid #334155'
      }}
    >
      <div
        style={{
          display:
            'flex',

          gap:
            '5px',

          alignItems:
            'center',

          color:
            '#38bdf8',

          fontSize:
            '10px'
        }}
      >
        {icon}

        {title}
      </div>

      <div
        style={{
          marginTop:
            '5px',

          color:
            '#ffffff',

          fontSize:
            '12px',

          fontWeight:
            'bold'
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ===========================================================
// PAYMENT BUTTON
// ===========================================================

function PaymentButton({
  active,
  title,
  color,
  icon,
  onClick
}: {
  active:
    boolean;

  title:
    string;

  color:
    string;

  icon:
    React.ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        backgroundColor:
          active
            ? `${color}22`
            : '#0f172a',

        border:
          `1px solid ${
            active
              ? color
              : '#334155'
          }`,

        color:
          '#ffffff',

        padding:
          '11px 7px',

        borderRadius:
          '10px',

        cursor:
          'pointer',

        display:
          'flex',

        flexDirection:
          'column',

        alignItems:
          'center',

        gap:
          '5px',

        fontSize:
          '10px',

        fontWeight:
          'bold'
      }}
    >
      <span
        style={{
          color
        }}
      >
        {icon}
      </span>

      {title}
    </button>
  );
}

// ===========================================================
// STATUS NORMALIZER
// ===========================================================

function normalizeStatus(
  status: string
) {
  const value =
    String(
      status || ''
    )
      .toLowerCase()
      .trim();

  // REVERSED

  if (
    value ===
      'reversed' ||
    value ===
      'reverse' ||
    value ===
      'refunded'
  ) {
    return 'reversed';
  }

  // PAID

  if (
    value ===
      'approved' ||
    value ===
      'paid' ||
    value ===
      'success' ||
    value ===
      'completed'
  ) {
    return 'paid';
  }

  // REJECTED

  if (
    value ===
      'rejected' ||
    value ===
      'failed' ||
    value ===
      'declined'
  ) {
    return 'rejected';
  }

  return 'pending';
}

// ===========================================================
// STATUS STYLE
// ===========================================================

function getStatusInfo(
  status: string
) {
  if (
    status ===
    'reversed'
  ) {
    return {
      label:
        'REVERSED',

      color:
        '#f87171',

      background:
        'rgba(239,68,68,0.12)',

      border:
        '#ef4444'
    };
  }

  if (
    status ===
    'paid'
  ) {
    return {
      label:
        'PAID',

      color:
        '#34d399',

      background:
        'rgba(16,185,129,0.12)',

      border:
        '#10b981'
    };
  }

  if (
    status ===
    'rejected'
  ) {
    return {
      label:
        'REJECTED',

      color:
        '#f87171',

      background:
        'rgba(239,68,68,0.12)',

      border:
        '#ef4444'
    };
  }

  return {
    label:
      'PENDING',

    color:
      '#fbbf24',

    background:
      'rgba(245,158,11,0.12)',

    border:
      '#f59e0b'
  };
}

// ===========================================================
// PAYMENT METHOD INFO
// ===========================================================

function getMethodInfo(
  method: string,

  source:
    | 'collection'
    | 'online'
) {
  const value =
    String(
      method || ''
    )
      .toLowerCase()
      .replace(
        /\s/g,
        ''
      );

  // EASYPAISA

  if (
    value.includes(
      'easypaisa'
    )
  ) {
    return {
      label:
        'Easypaisa',

      color:
        '#34d399',

      background:
        'rgba(16,185,129,0.12)'
    };
  }

  // JAZZCASH

  if (
    value.includes(
      'jazz'
    )
  ) {
    return {
      label:
        'JazzCash',

      color:
        '#f87171',

      background:
        'rgba(239,68,68,0.12)'
    };
  }

  // RAAST

  if (
    value.includes(
      'raast'
    ) ||
    value.includes(
      'rast'
    )
  ) {
    return {
      label:
        'Raast',

      color:
        '#fbbf24',

      background:
        'rgba(245,158,11,0.12)'
    };
  }

  // SADAPAY

  if (
    value.includes(
      'sadapay'
    )
  ) {
    return {
      label:
        'SadaPay',

      color:
        '#a78bfa',

      background:
        'rgba(139,92,246,0.12)'
    };
  }

  // NAYAPAY

  if (
    value.includes(
      'nayapay'
    )
  ) {
    return {
      label:
        'NayaPay',

      color:
        '#60a5fa',

      background:
        'rgba(59,130,246,0.12)'
    };
  }

  // BANK

  if (
    value.includes(
      'bank'
    )
  ) {
    return {
      label:
        'Bank Transfer',

      color:
        '#60a5fa',

      background:
        'rgba(59,130,246,0.12)'
    };
  }

  // CASH

  if (
    value.includes(
      'cash'
    )
  ) {
    return {
      label:
        'Cash',

      color:
        '#34d399',

      background:
        'rgba(16,185,129,0.12)'
    };
  }

  // COLLECTION UNKNOWN METHOD

  if (
    source ===
    'collection'
  ) {
    return {
      label:
        method ||
        'Collection',

      color:
        '#34d399',

      background:
        'rgba(16,185,129,0.12)'
    };
  }

  // ONLINE UNKNOWN

  return {
    label:
      method ||
      'Online',

    color:
      '#38bdf8',

    background:
      'rgba(56,189,248,0.12)'
  };
}

// ===========================================================
// DATE FORMAT
// ===========================================================

function formatDate(
  dateValue: string
) {
  if (
    !dateValue
  ) {
    return '-';
  }

  const date =
    new Date(
      dateValue
    );

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return date.toLocaleDateString(
    'en-PK',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric'
    }
  );
}

// ===========================================================
// TIME FORMAT
// ===========================================================

function formatTime(
  dateValue: string
) {
  if (
    !dateValue
  ) {
    return '-';
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateValue
    )
  ) {
    return '--';
  }

  const date =
    new Date(
      dateValue
    );

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return '--';
  }

  return date.toLocaleTimeString(
    'en-PK',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',

      hour12:
        true
    }
  );
}

// ===========================================================
// DATE + TIME
// ===========================================================

function formatDateTime(
  dateValue: string
) {
  if (
    !dateValue
  ) {
    return '-';
  }

  const date =
    new Date(
      dateValue
    );

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return date.toLocaleString(
    'en-PK',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',

      hour12:
        true
    }
  );
}

// ===========================================================
// STYLES
// ===========================================================

const labelStyle:
  React.CSSProperties = {
    display:
      'block',

    fontSize:
      '11px',

    color:
      '#94a3b8',

    marginBottom:
      '5px',

    fontWeight:
      'bold'
  };

const inputStyle:
  React.CSSProperties = {
    width:
      '100%',

    boxSizing:
      'border-box',

    backgroundColor:
      '#0f172a',

    border:
      '1px solid #3b82f6',

    color:
      '#ffffff',

    padding:
      '9px 10px',

    borderRadius:
      '8px',

    fontSize:
      '12px',

    outline:
      'none'
  };