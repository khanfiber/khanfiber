import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';

import {
  CreditCard,
  Search,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Gauge,
  User,
  DollarSign,
  CalendarDays,
  Clock3,
  Package,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Hash
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type BillingStatus =
  | 'active'
  | 'paused'
  | 'stopped';

interface CustomerType {
  id: number;

  serial_number?: string | null;

  full_name: string;

  pppoe_username: string;

  phone?: string | null;

  package_name?: string | null;

  speed?: string | null;

  monthly_price: number;

  billing_start_date?: string | null;

  bill_due_day?: number | null;

  grace_days?: number | null;

  billing_status?: BillingStatus | null;
}

interface PackageType {
  id: number;

  name: string;

  speed: string;

  price: number;
}

/* =========================================================
   PAGE
========================================================= */

export default function BillManagementPage() {
  const [customers, setCustomers] =
    useState<CustomerType[]>([]);

  const [packages, setPackages] =
    useState<PackageType[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    selectedCustomer,
    setSelectedCustomer
  ] = useState<CustomerType | null>(null);

  /* =========================
     EDITABLE VALUES
  ========================= */

  const [packageName, setPackageName] =
    useState('');

  const [speed, setSpeed] =
    useState('');

  const [monthlyPrice, setMonthlyPrice] =
    useState('');

  /*
    پہلی تاریخ جس سے اس customer
    کی monthly billing شروع ہوگی۔
  */
  const [
    billingStartDate,
    setBillingStartDate
  ] = useState('');

  /*
    ہر مہینے bill کی due date کا day.
    Example: 10 = ہر ماہ 10 تاریخ
  */
  const [billDueDay, setBillDueDay] =
    useState('10');

  /*
    Due date کے بعد کتنے دن grace.
  */
  const [graceDays, setGraceDays] =
    useState('0');

  const [
    billingStatus,
    setBillingStatus
  ] = useState<BillingStatus>('active');

  /* =========================
     PAGE STATE
  ========================= */

  const [loading, setLoading] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading
  ] = useState(true);

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState('');

  /* =========================================================
     LOAD CUSTOMERS + PACKAGES
  ========================================================= */

  const loadInitialData = async () => {
    setInitialLoading(true);
    setErrorMessage('');

    try {
      const [
        customerResult,
        packageResult
      ] = await Promise.all([
        supabase
          .from('customers')
          .select(`
            id,
            serial_number,
            full_name,
            pppoe_username,
            phone,
            package_name,
            speed,
            monthly_price,
            billing_start_date,
            bill_due_day,
            grace_days,
            billing_status
          `)
          .order('full_name', {
            ascending: true
          }),

        supabase
          .from('packages')
          .select(`
            id,
            name,
            speed,
            price
          `)
          .order('price', {
            ascending: true
          })
      ]);

      if (customerResult.error) {
        throw customerResult.error;
      }

      if (packageResult.error) {
        throw packageResult.error;
      }

      const cleanCustomers:
        CustomerType[] =
        (customerResult.data || []).map(
          (customer: any) => ({
            id: Number(customer.id),

            serial_number:
              customer.serial_number || null,

            full_name:
              String(
                customer.full_name || ''
              ),

            pppoe_username:
              String(
                customer.pppoe_username ||
                  ''
              ),

            phone:
              customer.phone || null,

            package_name:
              customer.package_name || '',

            speed:
              customer.speed || '',

            monthly_price:
              Number(
                customer.monthly_price || 0
              ),

            billing_start_date:
              customer.billing_start_date ||
              null,

            bill_due_day:
              Number(
                customer.bill_due_day || 10
              ),

            grace_days:
              Number(
                customer.grace_days || 0
              ),

            billing_status:
              customer.billing_status ||
              'active'
          })
        );

      const cleanPackages:
        PackageType[] =
        (packageResult.data || []).map(
          (pkg: any) => ({
            id: Number(pkg.id),

            name: String(
              pkg.name || ''
            ),

            speed: String(
              pkg.speed || ''
            ),

            price: Number(
              pkg.price || 0
            )
          })
        );

      setCustomers(cleanCustomers);

      setPackages(cleanPackages);

    } catch (err: any) {
      console.error(
        'Bill Management Load Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'ڈیٹا لوڈ نہیں ہو سکا۔'
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  /* =========================================================
     SEARCH FILTER
  ========================================================= */

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
            customer.phone
              ?.toLowerCase() || '';

          return (
            fullName.includes(search) ||
            username.includes(search) ||
            serial.includes(search) ||
            phone.includes(search)
          );
        })
        .slice(0, 20);

    }, [customers, searchTerm]);

  /* =========================================================
     SELECT CUSTOMER
  ========================================================= */

  const handleSelectCustomer = (
    customer: CustomerType
  ) => {
    setSelectedCustomer(customer);

    setSearchTerm(
      customer.full_name ||
        customer.pppoe_username
    );

    setPackageName(
      customer.package_name || ''
    );

    setSpeed(
      customer.speed || ''
    );

    setMonthlyPrice(
      String(
        customer.monthly_price || 0
      )
    );

    setBillingStartDate(
      customer.billing_start_date || ''
    );

    setBillDueDay(
      String(
        customer.bill_due_day || 10
      )
    );

    setGraceDays(
      String(
        customer.grace_days || 0
      )
    );

    setBillingStatus(
      customer.billing_status ||
        'active'
    );

    setErrorMessage('');

    setIsSuccess(false);
  };

  /* =========================================================
     PACKAGE SELECT
  ========================================================= */

  const handlePackageSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedPkgName =
      e.target.value;

    setPackageName(
      selectedPkgName
    );

    if (!selectedPkgName) {
      return;
    }

    const foundPackage =
      packages.find(
        pkg =>
          pkg.name ===
          selectedPkgName
      );

    if (foundPackage) {
      setSpeed(
        foundPackage.speed
      );

      setMonthlyPrice(
        String(
          foundPackage.price
        )
      );
    }
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!selectedCustomer) {
      throw new Error(
        'براہِ کرم پہلے صارف منتخب کریں۔'
      );
    }

    if (!packageName.trim()) {
      throw new Error(
        'پیکیج منتخب کریں۔'
      );
    }

    if (!speed.trim()) {
      throw new Error(
        'انٹرنیٹ سپیڈ درج کریں۔'
      );
    }

    const price =
      Number(monthlyPrice);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        'ماہانہ بل درست درج کریں۔'
      );
    }

    if (!billingStartDate) {
      throw new Error(
        'Monthly Billing Start Date منتخب کریں۔'
      );
    }

    const dueDay =
      Number(billDueDay);

    if (
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 28
    ) {
      throw new Error(
        'Monthly Due Day صرف 1 سے 28 تک ہو سکتا ہے۔'
      );
    }

    const grace =
      Number(graceDays);

    if (
      !Number.isInteger(grace) ||
      grace < 0
    ) {
      throw new Error(
        'Grace Days درست درج کریں۔'
      );
    }
  };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const handleSaveBillSettings =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (loading) return;

      setLoading(true);

      setErrorMessage('');

      setIsSuccess(false);

      try {
        validateForm();

        if (!selectedCustomer) {
          return;
        }

        const updateData = {
          package_name:
            packageName.trim(),

          speed:
            speed.trim(),

          monthly_price:
            Number(monthlyPrice),

          billing_start_date:
            billingStartDate,

          bill_due_day:
            Number(billDueDay),

          grace_days:
            Number(graceDays),

          billing_status:
            billingStatus
        };

        const {
          data,
          error
        } = await supabase
          .from('customers')
          .update(updateData)
          .eq(
            'id',
            selectedCustomer.id
          )
          .select(`
            id,
            serial_number,
            full_name,
            pppoe_username,
            phone,
            package_name,
            speed,
            monthly_price,
            billing_start_date,
            bill_due_day,
            grace_days,
            billing_status
          `)
          .single();

        if (error) {
          throw error;
        }

        const updatedCustomer:
          CustomerType = {
          id: Number(data.id),

          serial_number:
            data.serial_number || null,

          full_name:
            data.full_name || '',

          pppoe_username:
            data.pppoe_username || '',

          phone:
            data.phone || null,

          package_name:
            data.package_name || '',

          speed:
            data.speed || '',

          monthly_price:
            Number(
              data.monthly_price || 0
            ),

          billing_start_date:
            data.billing_start_date ||
            null,

          bill_due_day:
            Number(
              data.bill_due_day || 10
            ),

          grace_days:
            Number(
              data.grace_days || 0
            ),

          billing_status:
            data.billing_status ||
            'active'
        };

        /*
          Update customer locally
        */

        setCustomers(prev =>
          prev.map(customer =>
            customer.id ===
            updatedCustomer.id
              ? updatedCustomer
              : customer
          )
        );

        setSelectedCustomer(
          updatedCustomer
        );

        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
        }, 4000);

      } catch (err: any) {
        console.error(
          'Bill Settings Save Error:',
          err
        );

        setErrorMessage(
          err?.message ||
            'Billing settings محفوظ نہیں ہو سکیں۔'
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     CLEAR CUSTOMER
  ========================================================= */

  const clearSelection = () => {
    setSelectedCustomer(null);

    setSearchTerm('');

    setPackageName('');

    setSpeed('');

    setMonthlyPrice('');

    setBillingStartDate('');

    setBillDueDay('10');

    setGraceDays('0');

    setBillingStatus('active');

    setErrorMessage('');

    setIsSuccess(false);
  };

  /* =========================================================
     STYLES
  ========================================================= */

  const inputStyle:
    React.CSSProperties = {
      width: '100%',
      background:
        'linear-gradient(135deg,#071525,#091b2d)',
      border:
        '1px solid #334155',
      color: '#ffffff',
      padding:
        '10px 38px 10px 11px',
      borderRadius: '10px',
      fontSize: '12px',
      boxSizing: 'border-box',
      outline: 'none'
    };

  const labelStyle:
    React.CSSProperties = {
      display: 'block',
      fontSize: '10px',
      fontWeight: '800',
      color: '#cbd5e1',
      marginBottom: '5px'
    };

  const iconStyle:
    React.CSSProperties = {
      position: 'absolute',
      right: '12px',
      top: '11px',
      color: '#64748b',
      pointerEvents: 'none'
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
          maxWidth: '1300px',
          margin: '0 auto'
        }}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#081a2c 0%,#0b2035 55%,#09283a 100%)',
            border:
              '1px solid #164e63',
            borderRadius: '17px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            gap: '12px'
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
                width: '46px',
                height: '46px',
                borderRadius: '13px',
                background:
                  'rgba(56,189,248,.12)',
                border:
                  '1px solid rgba(56,189,248,.25)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center'
              }}
            >
              <CreditCard size={22} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: '900',
                  color: '#f8fafc'
                }}
              >
                بل مینجمنٹ
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '10px',
                  color: '#64748b'
                }}
              >
                Customer Billing & Package
                Management • One Click
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadInitialData}
            disabled={initialLoading}
            style={{
              background:
                'rgba(56,189,248,.08)',
              border:
                '1px solid rgba(56,189,248,.25)',
              color: '#38bdf8',
              padding: '8px 10px',
              borderRadius: '9px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: '700'
            }}
          >
            <RefreshCw
              size={13}
              className={
                initialLoading
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {isSuccess && (
          <div
            style={{
              background:
                'rgba(16,185,129,.10)',
              border:
                '1px solid rgba(16,185,129,.45)',
              color: '#34d399',
              padding: '11px 13px',
              borderRadius: '10px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <CheckCircle2
              size={16}
            />

            صارف کی Billing Settings
            کامیابی سے محفوظ ہو گئی ہیں۔
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(239,68,68,.10)',
              border:
                '1px solid rgba(239,68,68,.45)',
              color: '#f87171',
              padding: '11px 13px',
              borderRadius: '10px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <AlertCircle
              size={16}
            />

            {errorMessage}
          </div>
        )}

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border:
              '1px solid #183a55',
            borderRadius: '15px',
            padding: '15px'
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
              placeholder="نام، Customer ID، PPPoE Username یا Mobile..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(
                  e.target.value
                );

                if (
                  selectedCustomer
                ) {
                  setSelectedCustomer(
                    null
                  );
                }
              }}
              style={{
                ...inputStyle,
                border:
                  '1px solid #0891b2'
              }}
            />

            <Search
              size={15}
              style={{
                ...iconStyle,
                color: '#22d3ee'
              }}
            />

            {/* SEARCH RESULTS */}

            {searchTerm &&
              !selectedCustomer &&
              filteredCustomers.length >
                0 && (
                <div
                  style={{
                    position:
                      'absolute',
                    top:
                      'calc(100% + 5px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background:
                      '#071525',
                    border:
                      '1px solid #164e63',
                    borderRadius:
                      '10px',
                    overflow:
                      'hidden',
                    maxHeight:
                      '260px',
                    overflowY:
                      'auto',
                    boxShadow:
                      '0 15px 40px rgba(0,0,0,.45)'
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
                              'No Customer ID'}
                          </div>
                        </div>

                        <div
                          style={{
                            color:
                              '#38bdf8',
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
          </div>
        </div>

        {/* =====================================================
            SELECTED CUSTOMER
        ===================================================== */}

        {selectedCustomer && (
          <div
            style={{
              background:
                'linear-gradient(135deg,rgba(8,145,178,.12),rgba(37,99,235,.07))',
              border:
                '1px solid rgba(34,211,238,.25)',
              borderRadius: '13px',
              padding: '12px',
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
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}
            >
              <div
                style={{
                  width: '37px',
                  height: '37px',
                  borderRadius: '10px',
                  background:
                    'rgba(34,211,238,.12)',
                  color: '#22d3ee',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center'
                }}
              >
                <User size={17} />
              </div>

              <div>
                <div
                  style={{
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '900'
                  }}
                >
                  {
                    selectedCustomer.full_name
                  }
                </div>

                <div
                  style={{
                    color: '#64748b',
                    fontSize: '9px',
                    marginTop: '2px'
                  }}
                >
                  {selectedCustomer.serial_number ||
                    '-'}{' '}
                  •{' '}
                  {
                    selectedCustomer.pppoe_username
                  }
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearSelection}
              style={{
                background:
                  'rgba(239,68,68,.08)',
                border:
                  '1px solid rgba(239,68,68,.25)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '9px',
                cursor: 'pointer'
              }}
            >
              Change Customer
            </button>
          </div>
        )}

        {/* =====================================================
            SETTINGS FORM
        ===================================================== */}

        <form
          onSubmit={
            handleSaveBillSettings
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

          {/* =========================
              PACKAGE SECTION
          ========================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px'
            }}
          >
            <Package
              size={15}
              color="#38bdf8"
            />

            <h3
              style={{
                margin: 0,
                color: '#38bdf8',
                fontSize: '12px'
              }}
            >
              Package & Monthly Charges
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(210px,1fr))',
              gap: '12px'
            }}
          >

            {/* CUSTOMER */}

            <div>
              <label
                style={labelStyle}
              >
                منتخب صارف
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={
                    selectedCustomer
                      ? selectedCustomer.full_name
                      : ''
                  }
                  placeholder="کوئی صارف منتخب نہیں"
                  style={{
                    ...inputStyle,
                    color: '#f472b6'
                  }}
                />

                <User
                  size={14}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* CUSTOMER ID */}

            <div>
              <label
                style={labelStyle}
              >
                Customer ID
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={
                    selectedCustomer
                      ?.serial_number ||
                    ''
                  }
                  style={{
                    ...inputStyle,
                    color: '#67e8f9'
                  }}
                />

                <Hash
                  size={14}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* PACKAGE */}

            <div>
              <label
                style={labelStyle}
              >
                Internet Package *
              </label>

              <select
                value={packageName}
                onChange={
                  handlePackageSelect
                }
                disabled={
                  !selectedCustomer
                }
                style={{
                  ...inputStyle,
                  padding: '10px'
                }}
              >
                <option value="">
                  Package Select کریں
                </option>

                {packages.map(
                  pkg => (
                    <option
                      key={pkg.id}
                      value={pkg.name}
                    >
                      {pkg.name} -{' '}
                      {pkg.speed} - Rs{' '}
                      {Number(
                        pkg.price
                      ).toLocaleString()}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SPEED */}

            <div>
              <label
                style={labelStyle}
              >
                Internet Speed
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="text"
                  value={speed}
                  onChange={e =>
                    setSpeed(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedCustomer
                  }
                  placeholder="10 Mbps"
                  style={{
                    ...inputStyle,
                    color: '#38bdf8'
                  }}
                />

                <Gauge
                  size={14}
                  style={{
                    ...iconStyle,
                    color: '#38bdf8'
                  }}
                />
              </div>
            </div>

            {/* MONTHLY PRICE */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#34d399'
                }}
              >
                Monthly Bill (Rs) *
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="number"
                  min="0"
                  value={monthlyPrice}
                  onChange={e =>
                    setMonthlyPrice(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedCustomer
                  }
                  placeholder="1500"
                  style={{
                    ...inputStyle,
                    border:
                      '1px solid #059669',
                    color: '#34d399'
                  }}
                />

                <DollarSign
                  size={14}
                  style={{
                    ...iconStyle,
                    color: '#34d399'
                  }}
                />
              </div>
            </div>
          </div>

          {/* =========================
              BILLING SECTION
          ========================= */}

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop:
                '1px solid #183a55'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px'
              }}
            >
              <CalendarDays
                size={15}
                color="#fbbf24"
              />

              <h3
                style={{
                  margin: 0,
                  color: '#fbbf24',
                  fontSize: '12px'
                }}
              >
                Monthly Billing Settings
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(210px,1fr))',
                gap: '12px'
              }}
            >

              {/* BILL START DATE */}

              <div>
                <label
                  style={{
                    ...labelStyle,
                    color: '#fbbf24'
                  }}
                >
                  Monthly Bill Start Date *
                </label>

                <div
                  style={{
                    position:
                      'relative'
                  }}
                >
                  <input
                    type="date"
                    value={
                      billingStartDate
                    }
                    onChange={e =>
                      setBillingStartDate(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedCustomer
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #b45309',
                      color: '#fbbf24'
                    }}
                  />

                  <CalendarDays
                    size={14}
                    style={{
                      ...iconStyle,
                      color: '#fbbf24'
                    }}
                  />
                </div>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    color: '#64748b',
                    fontSize: '8px'
                  }}
                >
                  اس تاریخ سے صارف
                  کی ماہانہ billing
                  شروع ہوگی۔
                </p>
              </div>

              {/* DUE DAY */}

              <div>
                <label
                  style={labelStyle}
                >
                  Monthly Due Day *
                </label>

                <div
                  style={{
                    position:
                      'relative'
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={
                      billDueDay
                    }
                    onChange={e =>
                      setBillDueDay(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedCustomer
                    }
                    style={
                      inputStyle
                    }
                  />

                  <CalendarDays
                    size={14}
                    style={
                      iconStyle
                    }
                  />
                </div>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    color: '#64748b',
                    fontSize: '8px'
                  }}
                >
                  مثال: 10 کا مطلب
                  ہر ماہ 10 تاریخ due
                  date۔
                </p>
              </div>

              {/* GRACE DAYS */}

              <div>
                <label
                  style={labelStyle}
                >
                  Grace Days
                </label>

                <div
                  style={{
                    position:
                      'relative'
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    value={
                      graceDays
                    }
                    onChange={e =>
                      setGraceDays(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedCustomer
                    }
                    style={
                      inputStyle
                    }
                  />

                  <Clock3
                    size={14}
                    style={
                      iconStyle
                    }
                  />
                </div>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    color: '#64748b',
                    fontSize: '8px'
                  }}
                >
                  Due date کے بعد
                  اضافی مہلت کے دن۔
                </p>
              </div>

              {/* BILLING STATUS */}

              <div>
                <label
                  style={labelStyle}
                >
                  Billing Status
                </label>

                <div
                  style={{
                    position:
                      'relative'
                  }}
                >
                  <select
                    value={
                      billingStatus
                    }
                    onChange={e =>
                      setBillingStatus(
                        e.target
                          .value as BillingStatus
                      )
                    }
                    disabled={
                      !selectedCustomer
                    }
                    style={{
                      ...inputStyle,
                      padding:
                        '10px'
                    }}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="paused">
                      Paused
                    </option>

                    <option value="stopped">
                      Stopped
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* =========================
              BILLING SUMMARY
          ========================= */}

          {selectedCustomer && (
            <div
              style={{
                marginTop: '16px',
                background:
                  '#071525',
                border:
                  '1px solid #183a55',
                borderRadius:
                  '11px',
                padding: '11px',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(150px,1fr))',
                gap: '9px'
              }}
            >
              <MiniInfo
                title="Monthly Charge"
                value={`Rs ${Number(
                  monthlyPrice || 0
                ).toLocaleString()}`}
                color="#34d399"
              />

              <MiniInfo
                title="Billing Starts"
                value={
                  billingStartDate ||
                  'Not Set'
                }
                color="#fbbf24"
              />

              <MiniInfo
                title="Due Every Month"
                value={`Day ${
                  billDueDay || '-'
                }`}
                color="#38bdf8"
              />

              <MiniInfo
                title="Grace"
                value={`${
                  graceDays || 0
                } Days`}
                color="#c4b5fd"
              />

              <MiniInfo
                title="Status"
                value={
                  billingStatus.toUpperCase()
                }
                color={
                  billingStatus ===
                  'active'
                    ? '#34d399'
                    : billingStatus ===
                      'paused'
                    ? '#fbbf24'
                    : '#f87171'
                }
              />
            </div>
          )}

          {/* =========================
              SAVE BUTTON
          ========================= */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              marginTop: '18px'
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
                  !selectedCustomer
                    ? '#334155'
                    : 'linear-gradient(135deg,#0891b2,#2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius:
                  '9px',
                padding:
                  '10px 18px',
                fontSize: '11px',
                fontWeight: '900',
                cursor:
                  selectedCustomer
                    ? 'pointer'
                    : 'not-allowed',
                opacity:
                  selectedCustomer
                    ? 1
                    : 0.6,
                display: 'flex',
                alignItems:
                  'center',
                gap: '6px'
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  محفوظ ہو رہا ہے...
                </>
              ) : (
                <>
                  <Save
                    size={14}
                  />

                  Billing Settings محفوظ کریں
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  title,
  value,
  color
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div
        style={{
          color: '#64748b',
          fontSize: '8px'
        }}
      >
        {title}
      </div>

      <div
        style={{
          color,
          fontSize: '11px',
          fontWeight: '900',
          marginTop: '2px'
        }}
      >
        {value}
      </div>
    </div>
  );
}