import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  CreditCard,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Smartphone,
  QrCode,
  User,
  Wifi,
  Receipt,
  Clock
} from 'lucide-react';

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
  | 'bank';

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
  // PAYMENT METHOD DETAILS
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
      accountTitle: 'Haider Fiber Network',
      accountNumber: '0300-1234567',
      note: 'Easypaisa سے رقم بھیجنے کے بعد Transaction ID درج کریں۔'
    },

    jazzcash: {
      title: 'JazzCash',
      accountTitle: 'Haider Fiber Network',
      accountNumber: '0300-1234567',
      note: 'JazzCash سے رقم بھیجنے کے بعد Transaction ID درج کریں۔'
    },

    raast: {
      title: 'Raast ID',
      accountTitle: 'Haider Fiber Network',
      accountNumber: '0300-1234567',
      note: 'Raast ID پر رقم بھیج کر Transaction ID یا رسید فراہم کریں۔'
    },

    bank: {
      title: 'Bank Transfer',
      accountTitle: 'Haider Fiber Network',
      accountNumber: 'ACCOUNT NUMBER HERE',
      note: 'Bank transfer مکمل ہونے کے بعد Transaction ID یا رسید فراہم کریں۔'
    }
  };

  // =========================================================
  // LOAD CUSTOMER + BILLING
  // =========================================================

  const loadBillingData = async () => {
    setPageLoading(true);
    setErrorMsg('');

    try {
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

      // -----------------------------------------------------
      // CUSTOMER
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // ALL COLLECTIONS FOR TOTAL PAID
      // -----------------------------------------------------

      const {
        data: collections,
        error: collectionsError
      } = await supabase
        .from('collections')
        .select(`
          id,
          paid_amount,
          remaining_balance,
          payment_date
        `)
        .eq('customer_id', customerId)
        .order('id', {
          ascending: false
        });

      if (collectionsError) {
        throw collectionsError;
      }

      // -----------------------------------------------------
      // TOTAL PAID
      // -----------------------------------------------------

      const paidSum =
        (collections || []).reduce(
          (sum: number, item: any) =>
            sum +
            Number(item.paid_amount || 0),
          0
        );

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

      // -----------------------------------------------------
      // IMPORTANT:
      // اگر collection موجود ہے تو latest remaining ہی total due ہے
      // monthly bill دوبارہ add نہیں کریں گے
      // -----------------------------------------------------

      if (
        collections &&
        collections.length > 0
      ) {
        totalDue = Math.max(
          0,
          Number(
            collections[0]
              .remaining_balance || 0
          )
        );

        previousArrears =
          Math.max(
            0,
            totalDue - monthlyBill
          );
      } else {
        previousArrears =
          connectionCharges;

        totalDue =
          connectionCharges +
          monthlyBill;
      }

      // -----------------------------------------------------
      // CHECK PENDING ONLINE PAYMENT
      // -----------------------------------------------------

      const {
        data: pendingData,
        error: pendingError
      } = await supabase
        .from('online_payments')
        .select('id, amount, status')
        .eq('customer_id', customerId)
        .eq('status', 'pending')
        .limit(1);

      if (pendingError) {
        console.error(
          'Pending payment check:',
          pendingError
        );
      }

      setPendingPayment(
        !!(
          pendingData &&
          pendingData.length > 0
        )
      );

      setCustomer(
        custData as CustomerType
      );

      setBillingStats({
        monthlyBill,
        previousArrears,
        totalDue,
        totalPaid: paidSum
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
      setPageLoading(false);
    }
  };

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

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        'صرف تصویر اپ لوڈ کریں۔'
      );
      return;
    }

    setCompressing(true);
    setErrorMsg('');

    const reader =
      new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();

      img.src =
        event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const maxWidth = 500;

        if (width > maxWidth) {
          height = Math.round(
            (height * maxWidth) /
              width
          );

          width = maxWidth;
        }

        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext('2d');

        if (!ctx) {
          setCompressing(false);

          setErrorMsg(
            'تصویر process نہیں ہو سکی۔'
          );

          return;
        }

        // White background for JPEG
        ctx.fillStyle = '#ffffff';

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

        let quality = 0.65;

        let compressedDataUrl =
          canvas.toDataURL(
            'image/jpeg',
            quality
          );

        // تقریباً 15KB data URL target
        while (
          compressedDataUrl.length >
            20000 &&
          quality > 0.15
        ) {
          quality -= 0.05;

          compressedDataUrl =
            canvas.toDataURL(
              'image/jpeg',
              quality
            );
        }

        setReceiptBase64(
          compressedDataUrl
        );

        setReceiptImage(file);

        setCompressing(false);
      };

      img.onerror = () => {
        setCompressing(false);

        setErrorMsg(
          'تصویر پڑھنے میں خرابی پیش آئی۔'
        );
      };
    };

    reader.onerror = () => {
      setCompressing(false);

      setErrorMsg(
        'فائل پڑھنے میں خرابی پیش آئی۔'
      );
    };
  };

  // =========================================================
  // SUBMIT PAYMENT
  // =========================================================

  const handleSubmitPayment = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!customer) {
      setErrorMsg(
        'Customer record موجود نہیں ہے۔'
      );
      return;
    }

    if (pendingPayment) {
      setErrorMsg(
        'آپ کی ایک پیمنٹ پہلے ہی Verification کے لیے Pending ہے۔ ایڈمن کی تصدیق کا انتظار کریں۔'
      );
      return;
    }

    const numericAmount =
      Number(amountPaid);

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

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // -----------------------------------------------------
      // دوبارہ pending check تاکہ double submit نہ ہو
      // -----------------------------------------------------

      const {
        data: existingPending,
        error: pendingCheckError
      } = await supabase
        .from('online_payments')
        .select('id')
        .eq(
          'customer_id',
          customer.id
        )
        .eq('status', 'pending')
        .limit(1);

      if (pendingCheckError) {
        throw pendingCheckError;
      }

      if (
        existingPending &&
        existingPending.length > 0
      ) {
        setPendingPayment(true);

        throw new Error(
          'آپ کی ایک پیمنٹ پہلے ہی Pending ہے۔'
        );
      }

      // -----------------------------------------------------
      // SAVE ONLINE PAYMENT
      // -----------------------------------------------------

      const {
        error: insertError
      } = await supabase
        .from('online_payments')
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
              receiptBase64 || null,

            status: 'pending'
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      setPendingPayment(true);

      setSuccessMsg(
        'آپ کی پیمنٹ ریکویسٹ کامیابی سے ایڈمن کو بھیج دی گئی ہے۔ Verification کے بعد آپ کا بقایا خودکار طور پر اپڈیٹ ہو جائے گا۔'
      );

      setTransactionId('');
      setReceiptBase64('');
      setReceiptImage(null);
    } catch (err: any) {
      console.error(
        'Payment submit error:',
        err
      );

      setErrorMsg(
        err?.message ||
          'پیمنٹ بھیجنے میں خرابی پیش آئی۔'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (pageLoading) {
    return (
      <Layout showNavButtons={false}>
        <div
          style={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px',
            color: '#38bdf8'
          }}
        >
          <Loader2
            size={28}
            className="animate-spin"
          />

          <span
            style={{
              fontSize: '12px'
            }}
          >
            بل کی معلومات لوڈ ہو رہی ہیں...
          </span>
        </div>
      </Layout>
    );
  }

  const selectedPayment =
    paymentDetails[paymentMethod];

  return (
    <Layout showNavButtons={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '850px',
          margin: '0 auto'
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#10253e,#0b1e33)',
            border:
              '1px solid #10b981',
            padding: '14px 16px',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.18)',
              padding: '9px',
              borderRadius: '10px',
              color: '#34d399'
            }}
          >
            <CreditCard size={21} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: '900'
              }}
            >
              آن لائن بل ادائیگی
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                fontSize: '10px',
                color: '#93c5fd'
              }}
            >
              ONE CLICK • HAIDER FIBER NETWORK
            </p>
          </div>
        </div>

        {/* CUSTOMER INFO */}

        {customer && (
          <div
            style={{
              backgroundColor: '#1c2541',
              border:
                '1px solid #334155',
              borderRadius: '14px',
              padding: '14px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(150px,1fr))',
                gap: '10px'
              }}
            >
              <InfoBox
                icon={<User size={15} />}
                title="صارف"
                value={customer.full_name}
              />

              <InfoBox
                icon={<Receipt size={15} />}
                title="HFN ID"
                value={
                  customer.serial_number ||
                  '---'
                }
              />

              <InfoBox
                icon={<Wifi size={15} />}
                title="PPPoE"
                value={
                  customer.pppoe_username
                }
              />

              <InfoBox
                icon={<Wifi size={15} />}
                title="Package"
                value={`${customer.package_name || '---'} • ${customer.speed || '---'}`}
              />
            </div>
          </div>
        )}

        {/* BILL BREAKDOWN */}

        <div
          style={{
            backgroundColor: '#1c2541',
            border:
              '1px solid #334155',
            borderRadius: '14px',
            padding: '16px'
          }}
        >
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '13px',
              color: '#38bdf8',
              borderBottom:
                '1px solid #334155',
              paddingBottom: '8px'
            }}
          >
            واجبات و بل تفصیلات
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(140px,1fr))',
              gap: '10px'
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

        {/* PENDING NOTICE */}

        {pendingPayment && (
          <div
            style={{
              backgroundColor:
                'rgba(245,158,11,0.14)',
              border:
                '1px solid #f59e0b',
              color: '#fbbf24',
              padding: '12px',
              borderRadius: '11px',
              fontSize: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <Clock size={17} />

            آپ کی ایک Online Payment
            پہلے ہی Pending ہے۔ ایڈمن
            Verification کے بعد balance
            اپڈیٹ ہوگا۔
          </div>
        )}

        {/* SUCCESS */}

        {successMsg && (
          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.15)',
              border:
                '1px solid #10b981',
              color: '#34d399',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={17} />
            {successMsg}
          </div>
        )}

        {/* ERROR */}

        {errorMsg && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',
              border:
                '1px solid #ef4444',
              color: '#f87171',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={17} />
            {errorMsg}
          </div>
        )}

        {/* PAYMENT FORM */}

        <form
          onSubmit={
            handleSubmitPayment
          }
          style={{
            backgroundColor: '#1c2541',
            border:
              '1px solid #334155',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#38bdf8'
            }}
          >
            ادائیگی کا طریقہ منتخب کریں
          </h3>

          {/* METHODS */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(125px,1fr))',
              gap: '8px'
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
                <Smartphone size={19} />
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
                <Smartphone size={19} />
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
                <QrCode size={19} />
              }
              onClick={() =>
                setPaymentMethod('raast')
              }
            />

            <PaymentButton
              active={
                paymentMethod ===
                'bank'
              }
              title="Bank"
              color="#3b82f6"
              icon={
                <Building size={19} />
              }
              onClick={() =>
                setPaymentMethod('bank')
              }
            />
          </div>

          {/* ACCOUNT DETAILS */}

          <div
            style={{
              backgroundColor: '#0f172a',
              border:
                '1px solid #334155',
              borderLeft:
                '3px solid #38bdf8',
              padding: '12px',
              borderRadius: '9px'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#ffffff'
              }}
            >
              {
                selectedPayment.title
              }
            </div>

            <div
              style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#94a3b8'
              }}
            >
              Account Title:{' '}
              <strong
                style={{
                  color: '#ffffff'
                }}
              >
                {
                  selectedPayment.accountTitle
                }
              </strong>
            </div>

            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#38bdf8',
                direction: 'ltr',
                textAlign: 'left',
                fontWeight: 'bold'
              }}
            >
              {
                selectedPayment.accountNumber
              }
            </div>

            <div
              style={{
                marginTop: '7px',
                fontSize: '10px',
                color: '#64748b'
              }}
            >
              {selectedPayment.note}
            </div>
          </div>

          {/* AMOUNT */}

          <div>
            <label
              style={labelStyle}
            >
              جمع کی جانے والی رقم (Rs)
              *
            </label>

            <input
              type="number"
              min="1"
              max={
                billingStats.totalDue ||
                undefined
              }
              value={amountPaid}
              onChange={(e) =>
                setAmountPaid(
                  e.target.value
                )
              }
              required
              disabled={
                pendingPayment ||
                billingStats.totalDue <= 0
              }
              style={inputStyle}
            />
          </div>

          {/* TRANSACTION ID */}

          <div>
            <label
              style={labelStyle}
            >
              Transaction ID / TRX ID
            </label>

            <input
              type="text"
              placeholder="مثلاً: 9876543210"
              value={transactionId}
              onChange={(e) =>
                setTransactionId(
                  e.target.value
                )
              }
              disabled={pendingPayment}
              style={{
                ...inputStyle,
                direction: 'ltr'
              }}
            />
          </div>

          {/* RECEIPT */}

          <div>
            <label
              style={labelStyle}
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
                display: 'none'
              }}
              id="receipt-upload"
              disabled={pendingPayment}
            />

            <label
              htmlFor="receipt-upload"
              style={{
                backgroundColor:
                  '#0f172a',
                border:
                  '1px dashed #3b82f6',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '9px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                gap: '6px',
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
                <Upload size={15} />
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
                  marginTop: '10px'
                }}
              >
                <img
                  src={receiptBase64}
                  alt="Payment Receipt"
                  style={{
                    maxWidth: '180px',
                    maxHeight: '180px',
                    borderRadius: '8px',
                    border:
                      '1px solid #334155',
                    objectFit: 'contain'
                  }}
                />

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '10px',
                    color: '#34d399'
                  }}
                >
                  ✓ رسید تیار ہے
                </p>
              </div>
            )}
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              loading ||
              compressing ||
              pendingPayment ||
              billingStats.totalDue <= 0
            }
            style={{
              backgroundColor:
                pendingPayment ||
                billingStats.totalDue <= 0
                  ? '#475569'
                  : '#10b981',

              color: '#ffffff',
              padding: '11px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor:
                pendingPayment
                  ? 'not-allowed'
                  : 'pointer',

              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              gap: '6px'
            }}
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send size={16} />
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
      </div>
    </Layout>
  );
}

// ===========================================================
// COMPONENTS
// ===========================================================

function BillCard({
  title,
  value,
  color
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        padding: '11px',
        borderRadius: '9px',
        border: `1px solid ${color}`
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: '#94a3b8'
        }}
      >
        {title}
      </span>

      <h4
        style={{
          margin: '4px 0 0',
          fontSize: '16px',
          color,
          fontWeight: '900'
        }}
      >
        Rs {value.toLocaleString()}
      </h4>
    </div>
  );
}

function InfoBox({
  icon,
  title,
  value
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        padding: '10px',
        borderRadius: '9px',
        border:
          '1px solid #334155'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
          color: '#38bdf8',
          fontSize: '10px'
        }}
      >
        {icon}
        {title}
      </div>

      <div
        style={{
          marginTop: '5px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PaymentButton({
  active,
  title,
  color,
  icon,
  onClick
}: {
  active: boolean;
  title: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: active
          ? `${color}22`
          : '#0f172a',

        border: `1px solid ${
          active ? color : '#334155'
        }`,

        color: '#ffffff',
        padding: '11px',
        borderRadius: '10px',
        cursor: 'pointer',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',

        fontSize: '11px',
        fontWeight: 'bold'
      }}
    >
      <span style={{ color }}>
        {icon}
      </span>

      {title}
    </button>
  );
}

const labelStyle:
  React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#94a3b8',
  marginBottom: '5px',
  fontWeight: 'bold'
};

const inputStyle:
  React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#0f172a',
  border: '1px solid #3b82f6',
  color: '#ffffff',
  padding: '9px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  outline: 'none'
};