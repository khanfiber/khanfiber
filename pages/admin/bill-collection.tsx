import React, { useState, useEffect } from 'react';
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
  User,
  Wifi,
  Wallet,
  Banknote,
  Calculator
} from 'lucide-react';

interface CustomerType {
  id: number;
  serial_number?: string;
  full_name: string;
  pppoe_username: string;
  phone: string;
  whatsapp: string;
  monthly_price: number;
  connection_charges?: number;
  package_name?: string;
  speed?: string;
}

export default function BillCollection() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerType | null>(null);

  const [previousArrears, setPreviousArrears] = useState<number>(0);
  const [currentBill, setCurrentBill] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // =========================================================
  // 1. LOAD CUSTOMERS FROM SUPABASE
  // =========================================================
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);

        const { data, error } = await supabase
          .from('customers')
          .select(`
            id,
            serial_number,
            full_name,
            pppoe_username,
            phone,
            whatsapp,
            monthly_price,
            connection_charges,
            package_name,
            speed
          `)
          .order('full_name', { ascending: true });

        if (error) {
          console.error('Fetch customers error:', error);
          setErrorMessage(`Customers Error: ${error.message}`);
          return;
        }

        setCustomers((data || []) as CustomerType[]);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(
          err?.message || 'صارفین لوڈ کرنے میں خرابی پیش آئی۔'
        );
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // =========================================================
  // 2. FILTER CUSTOMERS
  // =========================================================
  const filteredCustomers = customers
    .filter((customer) => {
      const term = searchTerm.toLowerCase().trim();

      if (!term) return false;

      return (
        customer.full_name?.toLowerCase().includes(term) ||
        customer.pppoe_username?.toLowerCase().includes(term) ||
        customer.serial_number?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term)
      );
    })
    .slice(0, 20);

  // =========================================================
  // 3. SELECT CUSTOMER
  // =========================================================
  const handleSelectCustomer = async (customer: CustomerType) => {
    try {
      setSelectedCustomer(customer);

      setSearchTerm(
        customer.full_name ||
          customer.pppoe_username ||
          customer.serial_number ||
          ''
      );

      setCurrentBill(Number(customer.monthly_price) || 0);
      setPreviousArrears(0);
      setPaidAmount('');
      setErrorMessage('');
      setIsSuccess(false);

      // آخری collection record حاصل کریں
      const { data, error } = await supabase
        .from('collections')
        .select('remaining_balance')
        .eq('customer_id', customer.id)
        .order('id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Previous collection error:', error);
        setErrorMessage(
          `پچھلا بل حاصل کرنے میں خرابی: ${error.message}`
        );
        return;
      }

      if (data && data.length > 0) {
        // پہلے سے collection موجود ہے
        setPreviousArrears(
          Number(data[0].remaining_balance) || 0
        );
      } else {
        // پہلا بل ہے تو connection charges بقایا میں شامل ہوں گے
        setPreviousArrears(
          Number(customer.connection_charges) || 0
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'صارف منتخب کرنے میں خرابی پیش آئی۔'
      );
    }
  };

  // =========================================================
  // 4. BILL CALCULATIONS
  // =========================================================
  const totalAmount =
    Number(previousArrears || 0) +
    Number(currentBill || 0);

  const numericPaid =
    paidAmount.trim() !== ''
      ? Number(paidAmount)
      : 0;

  const remainingBalance =
    totalAmount - numericPaid;

  // =========================================================
  // 5. SAVE BILL
  // =========================================================
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setIsSuccess(false);

    if (!selectedCustomer) {
      setErrorMessage(
        'براہِ کرم پہلے کسی صارف کا انتخاب کریں!'
      );
      return;
    }

    if (!paidAmount || Number(paidAmount) < 0) {
      setErrorMessage(
        'براہِ کرم درست جمع رقم درج کریں۔'
      );
      return;
    }

    if (numericPaid > totalAmount) {
      setErrorMessage(
        `جمع رقم کل بل سے زیادہ نہیں ہو سکتی۔ کل قابلِ ادائیگی رقم Rs ${totalAmount.toLocaleString()} ہے۔`
      );
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // SAVE TO COLLECTIONS TABLE
      // =====================================================
      const { error } = await supabase
        .from('collections')
        .insert([
          {
            customer_id: selectedCustomer.id,
            previous_arrears: previousArrears,
            current_bill: currentBill,
            total_amount: totalAmount,
            paid_amount: numericPaid,
            remaining_balance: remainingBalance,
            payment_date: new Date().toISOString()
          }
        ]);

      if (error) {
        setErrorMessage(
          `Supabase Error: ${error.message}`
        );
        return;
      }

      setIsSuccess(true);

      // =====================================================
      // WHATSAPP RECEIPT
      // =====================================================
      const targetPhone =
        selectedCustomer.whatsapp ||
        selectedCustomer.phone;

      if (targetPhone) {
        const receiptDate =
          new Date().toLocaleDateString('en-GB');

        const whatsappMsg =
          `🌐 *ONE CLICK | HAIDER FIBER NETWORK*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🧾 *بل وصولی رسید*\n\n` +

          `محترم *${selectedCustomer.full_name || 'صارف'}*!\n` +
          `آپ کی بل وصولی کامیابی سے درج کر لی گئی ہے۔\n\n` +

          `👤 *صارف کی تفصیلات*\n` +
          `▫️ کسٹمر ID: ${selectedCustomer.serial_number || 'N/A'}\n` +
          `▫️ PPPoE User: ${selectedCustomer.pppoe_username || 'N/A'}\n` +
          `▫️ پیکیج: ${selectedCustomer.package_name || 'N/A'}\n` +
          `▫️ سپیڈ: ${selectedCustomer.speed || 'N/A'}\n\n` +

          `💰 *بل کی تفصیلات*\n` +
          `▫️ پچھلا بقایا / کنکشن چارجز: Rs ${previousArrears.toLocaleString()}\n` +
          `▫️ موجودہ ماہانہ بل: Rs ${currentBill.toLocaleString()}\n` +
          `▫️ کل قابلِ ادائیگی رقم: Rs ${totalAmount.toLocaleString()}\n\n` +

          `✅ *جمع کردہ رقم: Rs ${numericPaid.toLocaleString()}*\n` +
          `🔻 *بقیہ واجبات: Rs ${remainingBalance.toLocaleString()}*\n\n` +

          `📅 تاریخ: ${receiptDate}\n\n` +

          `━━━━━━━━━━━━━━━━━━\n` +
          `شکریہ!\n` +
          `*Haider Fiber Network Team*\n` +
          `Powered by *One Click*`;

        openWhatsAppDirect(
          targetPhone,
          whatsappMsg
        );
      }

      setPaidAmount('');

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(
        `خرابی پیش آئی: ${
          err?.message || 'Unknown Error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PAGE
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
        {/* ===================================================
            TOP HEADER
        =================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, #0f2740 0%, #0b1f35 100%)',
            padding: '14px',
            borderRadius: '18px',
            border: '1px solid #10b981'
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
                  'rgba(16,185,129,0.15)',
                padding: '10px',
                borderRadius: '12px',
                color: '#34d399',
                border:
                  '1px solid rgba(16,185,129,0.3)'
              }}
            >
              <Receipt size={22} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '900',
                  color: '#ffffff'
                }}
              >
                بل وصولی
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

        {/* ===================================================
            SUCCESS MESSAGE
        =================================================== */}
        {isSuccess && (
          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={17} />

            بل کامیابی سے محفوظ ہو گیا اور
            WhatsApp رسید کھول دی گئی ہے۔
          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}
        {errorMessage && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '12px 14px',
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

        {/* ===================================================
            MAIN PANEL
        =================================================== */}
        <div
          style={{
            background:
              'linear-gradient(180deg,#10233c,#0d1d32)',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid #263b55'
          }}
        >
          {/* SEARCH */}
          <div
            style={{
              position: 'relative',
              marginBottom: '18px'
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#38bdf8',
                marginBottom: '7px'
              }}
            >
              صارف تلاش کریں
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={
                  customersLoading
                    ? 'صارفین لوڈ ہو رہے ہیں...'
                    : 'نام، HFN ID، موبائل یا PPPoE یوزر نیم...'
                }
                value={searchTerm}
                disabled={customersLoading}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedCustomer(null);
                  setPreviousArrears(0);
                  setCurrentBill(0);
                  setPaidAmount('');
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#071829',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  padding: '11px 42px 11px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />

              {customersLoading ? (
                <Loader2
                  size={17}
                  style={{
                    position: 'absolute',
                    right: '13px',
                    top: '11px',
                    color: '#38bdf8'
                  }}
                />
              ) : (
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    right: '13px',
                    top: '11px',
                    color: '#38bdf8'
                  }}
                />
              )}
            </div>

            {/* SEARCH RESULTS */}
            {searchTerm &&
              !selectedCustomer &&
              filteredCustomers.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#071829',
                    border: '1px solid #3b82f6',
                    borderRadius: '12px',
                    marginTop: '5px',
                    zIndex: 50,
                    maxHeight: '230px',
                    overflowY: 'auto',
                    boxShadow:
                      '0 15px 35px rgba(0,0,0,0.45)'
                  }}
                >
                  {filteredCustomers.map(
                    (customer) => (
                      <div
                        key={customer.id}
                        onClick={() =>
                          handleSelectCustomer(
                            customer
                          )
                        }
                        style={{
                          padding: '11px 12px',
                          borderBottom:
                            '1px solid #1e293b',
                          cursor: 'pointer'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            gap: '10px'
                          }}
                        >
                          <span
                            style={{
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            {customer.full_name}
                          </span>

                          <span
                            style={{
                              color: '#38bdf8',
                              fontSize: '11px',
                              direction: 'ltr'
                            }}
                          >
                            {customer.serial_number ||
                              customer.pppoe_username}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop: '4px',
                            color: '#64748b',
                            fontSize: '10px'
                          }}
                        >
                          {customer.package_name ||
                            'Package N/A'}
                          {' • '}
                          {customer.speed ||
                            'Speed N/A'}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>

          {/* =================================================
              SELECTED CUSTOMER CARD
          ================================================= */}
          {selectedCustomer && (
            <div
              style={{
                backgroundColor:
                  'rgba(14,165,233,0.08)',
                border:
                  '1px solid rgba(56,189,248,0.35)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '16px'
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
                      'rgba(56,189,248,0.15)',
                    padding: '8px',
                    borderRadius: '10px',
                    color: '#38bdf8'
                  }}
                >
                  <User size={18} />
                </div>

                <div>
                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    {selectedCustomer.full_name}
                  </div>

                  <div
                    style={{
                      color: '#94a3b8',
                      fontSize: '10px',
                      marginTop: '2px'
                    }}
                  >
                    {selectedCustomer.serial_number ||
                      'HFN ID N/A'}
                    {' • '}
                    {selectedCustomer.pppoe_username}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '7px'
                }}
              >
                {selectedCustomer.package_name && (
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor:
                        'rgba(59,130,246,0.15)',
                      borderRadius: '6px',
                      color: '#93c5fd',
                      fontSize: '10px'
                    }}
                  >
                    {selectedCustomer.package_name}
                  </span>
                )}

                {selectedCustomer.speed && (
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor:
                        'rgba(16,185,129,0.15)',
                      borderRadius: '6px',
                      color: '#34d399',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Wifi size={11} />
                    {selectedCustomer.speed}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              BILL FORM
          ================================================= */}
          <form
            onSubmit={handleSaveBill}
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(180px,1fr))',
              gap: '12px'
            }}
          >
            {/* PREVIOUS */}
            <BillBox
              label="پچھلا بقایا / کنکشن چارجز"
              value={previousArrears}
              color="#f87171"
              icon={<Wallet size={15} />}
            />

            {/* MONTHLY */}
            <BillBox
              label="موجودہ ماہانہ بل"
              value={currentBill}
              color="#38bdf8"
              icon={<Receipt size={15} />}
            />

            {/* TOTAL */}
            <BillBox
              label="کل قابلِ ادائیگی رقم"
              value={totalAmount}
              color="#f472b6"
              icon={<Calculator size={15} />}
            />

            {/* PAID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#34d399',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}
              >
                جمع رقم (Paid Amount) *
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  required
                  placeholder="رقم درج کریں..."
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(e.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#071829',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    padding: '10px 36px 10px 10px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                />

                <Banknote
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '11px',
                    color: '#10b981'
                  }}
                />
              </div>
            </div>

            {/* REMAINING */}
            <div
              style={{
                gridColumn: '1 / -1'
              }}
            >
              <div
                style={{
                  backgroundColor: '#071829',
                  padding: '14px',
                  borderRadius: '12px',
                  border:
                    remainingBalance > 0
                      ? '1px solid #ef4444'
                      : '1px solid #10b981',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: '#cbd5e1',
                    fontWeight: 'bold'
                  }}
                >
                  بقیہ واجبات
                </span>

                <span
                  style={{
                    fontSize: '18px',
                    color:
                      remainingBalance > 0
                        ? '#f87171'
                        : '#34d399',
                    fontWeight: '900',
                    direction: 'ltr'
                  }}
                >
                  Rs{' '}
                  {remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* SUBMIT */}
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '5px'
              }}
            >
              <button
                type="submit"
                disabled={
                  loading || !selectedCustomer
                }
                style={{
                  width: '100%',
                  maxWidth: '330px',
                  background:
                    loading || !selectedCustomer
                      ? '#334155'
                      : 'linear-gradient(135deg,#10b981,#059669)',
                  color: '#ffffff',
                  padding: '11px 18px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor:
                    loading || !selectedCustomer
                      ? 'not-allowed'
                      : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px'
                }}
              >
                {loading ? (
                  <Loader2 size={16} />
                ) : (
                  <Send size={16} />
                )}

                {loading
                  ? 'بل محفوظ ہو رہا ہے...'
                  : 'بل محفوظ کریں اور WhatsApp رسید بھیجیں'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

// ===========================================================
// REUSABLE BILL BOX
// ===========================================================

function BillBox({
  label,
  value,
  color,
  icon
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          color,
          fontWeight: 'bold',
          marginBottom: '5px'
        }}
      >
        {icon}
        {label}
      </label>

      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#071829',
          border: `1px solid ${color}`,
          color,
          padding: '10px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          direction: 'ltr',
          textAlign: 'right'
        }}
      >
        Rs {Number(value || 0).toLocaleString()}
      </div>
    </div>
  );
}