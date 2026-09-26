import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  TrendingUp,
  CalendarDays,
  Search,
  RefreshCw,
  Loader2,
  WalletCards,
  Cable,
  Receipt,
  DollarSign,
  User,
  AlertCircle
} from 'lucide-react';

type IncomeCategory =
  | 'all'
  | 'monthly_charges'
  | 'connection_charges';

interface IncomeRecord {
  id: number;
  customer_id: number;
  paid_amount: number;
  payment_date: string;
  income_category: string | null;
  payment_method?: string | null;
  receipt_number?: string | null;
  payment_note?: string | null;

  customers?: {
    full_name: string;
    serial_number?: string | null;
    pppoe_username?: string | null;
  } | null;
}

export default function IncomeReportPage() {
  const today = new Date().toISOString().split('T')[0];

  const firstDay = new Date();
  firstDay.setDate(1);

  const firstDayString =
    firstDay.toISOString().split('T')[0];

  const [fromDate, setFromDate] =
    useState(firstDayString);

  const [toDate, setToDate] =
    useState(today);

  const [category, setCategory] =
    useState<IncomeCategory>('all');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [records, setRecords] =
    useState<IncomeRecord[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =====================================================
     LOAD INCOME
  ===================================================== */

  const loadIncome = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      if (!fromDate || !toDate) {
        throw new Error(
          'From Date اور To Date منتخب کریں۔'
        );
      }

      if (fromDate > toDate) {
        throw new Error(
          'From Date، To Date سے آگے نہیں ہو سکتی۔'
        );
      }

      const startDate =
        `${fromDate}T00:00:00`;

      const endDate =
        `${toDate}T23:59:59.999`;

      let query = supabase
        .from('collections')
        .select(`
          id,
          customer_id,
          paid_amount,
          payment_date,
          income_category,
          payment_method,
          receipt_number,
          payment_note,
          customers (
            full_name,
            serial_number,
            pppoe_username
          )
        `)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .gt('paid_amount', 0)
        .order('payment_date', {
          ascending: false
        });

      if (category !== 'all') {
        query = query.eq(
          'income_category',
          category
        );
      }

      const { data, error } =
        await query;

      if (error) {
        throw error;
      }

      setRecords(
        (data || []) as unknown as IncomeRecord[]
      );
    } catch (err: any) {
      console.error(
        'Income Report Error:',
        err
      );

      setRecords([]);

      setErrorMessage(
        err?.message ||
          'انکم رپورٹ لوڈ نہیں ہو سکی۔'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredRecords =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return records;
      }

      return records.filter(item => {
        const name =
          item.customers?.full_name
            ?.toLowerCase() || '';

        const serial =
          item.customers?.serial_number
            ?.toLowerCase() || '';

        const username =
          item.customers?.pppoe_username
            ?.toLowerCase() || '';

        const receipt =
          item.receipt_number
            ?.toLowerCase() || '';

        return (
          name.includes(search) ||
          serial.includes(search) ||
          username.includes(search) ||
          receipt.includes(search)
        );
      });
    }, [records, searchTerm]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totals =
    useMemo(() => {
      let monthly = 0;
      let connection = 0;

      filteredRecords.forEach(item => {
        const amount =
          Number(item.paid_amount || 0);

        if (
          item.income_category ===
          'monthly_charges'
        ) {
          monthly += amount;
        }

        if (
          item.income_category ===
          'connection_charges'
        ) {
          connection += amount;
        }
      });

      return {
        monthly,
        connection,
        total: monthly + connection
      };
    }, [filteredRecords]);

  /* =====================================================
     HELPERS
  ===================================================== */

  const categoryName = (
    value?: string | null
  ) => {
    if (
      value === 'monthly_charges'
    ) {
      return 'ماہانہ چارجز';
    }

    if (
      value === 'connection_charges'
    ) {
      return 'کنکشن چارجز';
    }

    return 'غیر متعین';
  };

  const methodName = (
    value?: string | null
  ) => {
    switch (value) {
      case 'cash':
        return 'Cash';

      case 'easypaisa':
        return 'Easypaisa';

      case 'jazzcash':
        return 'JazzCash';

      case 'bank':
        return 'Bank';

      case 'raast':
        return 'Raast';

      case 'online':
        return 'Online';

      default:
        return value || '-';
    }
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '-';

    return new Date(
      date
    ).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const inputStyle:
    React.CSSProperties = {
      width: '100%',
      background: '#071525',
      border: '1px solid #1e4663',
      color: '#ffffff',
      padding: '10px 11px',
      borderRadius: '10px',
      fontSize: '11px',
      boxSizing: 'border-box',
      outline: 'none'
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#081a2c,#0b2035 55%,#09283a)',
            border: '1px solid #164e63',
            borderRadius: '17px',
            padding: '16px',
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
                'rgba(16,185,129,.12)',
              border:
                '1px solid rgba(52,211,153,.25)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={23} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                color: '#f8fafc',
                fontSize: '17px',
                fontWeight: '800'
              }}
            >
              انکم رپورٹ
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                color: '#64748b',
                fontSize: '10px'
              }}
            >
              Income Report • One Click
            </p>
          </div>
        </div>

        {/* FILTER */}

        <div
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border: '1px solid #183a55',
            borderRadius: '15px',
            padding: '14px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(180px,1fr))',
              gap: '10px'
            }}
          >
            <div>
              <label style={labelStyle}>
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={e =>
                  setFromDate(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={e =>
                  setToDate(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                انکم کیٹیگری
              </label>

              <select
                value={category}
                onChange={e =>
                  setCategory(
                    e.target
                      .value as IncomeCategory
                  )
                }
                style={inputStyle}
              >
                <option value="all">
                  تمام انکم
                </option>

                <option value="monthly_charges">
                  ماہانہ چارجز
                </option>

                <option value="connection_charges">
                  کنکشن چارجز
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Search
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="text"
                  placeholder="نام، ID، Username..."
                  value={searchTerm}
                  onChange={e =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    paddingRight: '35px'
                  }}
                />

                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '11px',
                    color: '#64748b'
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '11px'
            }}
          >
            <button
              type="button"
              onClick={loadIncome}
              disabled={loading}
              style={{
                background:
                  'linear-gradient(135deg,#0891b2,#2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9px',
                padding: '9px 15px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw size={14} />
              )}

              رپورٹ لوڈ کریں
            </button>
          </div>
        </div>

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
              alignItems: 'center',
              gap: '7px',
              fontSize: '11px'
            }}
          >
            <AlertCircle size={15} />
            {errorMessage}
          </div>
        )}

        {/* TOTAL CARDS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: '10px'
          }}
        >
          <SummaryCard
            title="کل انکم"
            amount={totals.total}
            icon={<DollarSign size={19} />}
            color="#34d399"
          />

          <SummaryCard
            title="ماہانہ چارجز"
            amount={totals.monthly}
            icon={<WalletCards size={19} />}
            color="#a78bfa"
          />

          <SummaryCard
            title="کنکشن چارجز"
            amount={totals.connection}
            icon={<Cable size={19} />}
            color="#38bdf8"
          />

          <div
            style={{
              background: '#0b1b2e',
              border: '1px solid #183a55',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background:
                  'rgba(245,158,11,.12)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Receipt size={19} />
            </div>

            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '9px'
                }}
              >
                Transactions
              </div>

              <div
                style={{
                  color: '#fbbf24',
                  fontSize: '17px',
                  fontWeight: '900'
                }}
              >
                {filteredRecords.length}
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div
          style={{
            background:
              'linear-gradient(145deg,#0b1b2e,#0b2034)',
            border: '1px solid #183a55',
            borderRadius: '15px',
            padding: '12px',
            overflowX: 'auto'
          }}
        >
          {loading ? (
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
                minWidth: '850px',
                borderCollapse: 'collapse',
                fontSize: '11px',
                textAlign: 'right'
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
                  <th style={thStyle}>تاریخ</th>
                  <th style={thStyle}>صارف</th>
                  <th style={thStyle}>Customer ID</th>
                  <th style={thStyle}>کیٹیگری</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Receipt</th>
                  <th style={thStyle}>رقم</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: '25px',
                        textAlign: 'center',
                        color: '#64748b'
                      }}
                    >
                      منتخب مدت میں کوئی انکم موجود نہیں۔
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(
                    (item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom:
                            '1px solid #14283c'
                        }}
                      >
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            item.payment_date
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <User
                              size={12}
                              color="#64748b"
                            />

                            <span
                              style={{
                                color: '#ffffff',
                                fontWeight: '700'
                              }}
                            >
                              {item.customers
                                ?.full_name ||
                                'Unknown'}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: '#38bdf8'
                          }}
                        >
                          {item.customers
                            ?.serial_number ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              color:
                                item.income_category ===
                                'connection_charges'
                                  ? '#38bdf8'
                                  : '#c4b5fd',
                              fontWeight: '700'
                            }}
                          >
                            {categoryName(
                              item.income_category
                            )}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {methodName(
                            item.payment_method
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: '#94a3b8'
                          }}
                        >
                          {item.receipt_number ||
                            '-'}
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
                            item.paid_amount || 0
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
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

/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
  title,
  amount,
  icon,
  color
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background: '#0b1b2e',
        border: '1px solid #183a55',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '9px'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
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
            fontSize: '15px',
            fontWeight: '900'
          }}
        >
          Rs {amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '10px',
  fontWeight: '700',
  marginBottom: '5px'
};

const thStyle: React.CSSProperties = {
  padding: '9px',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '9px',
  color: '#cbd5e1',
  whiteSpace: 'nowrap'
};