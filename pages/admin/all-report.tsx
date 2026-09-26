import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  CalendarDays,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  FileText
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type ReportType = 'income' | 'expense';

interface ReportRow {
  id: string | number;
  type: ReportType;
  date: string;
  category: string;
  description: string;
  customerName?: string;
  reference?: string;
  amount: number;
}

/* =========================================================
   DATE HELPERS
========================================================= */

const getLocalToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getFirstDayOfMonth = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}-01`;
};

const formatDate = (value: string) => {
  if (!value) return '---';

  try {
    const dateOnly = value.substring(0, 10);
    const [year, month, day] = dateOnly.split('-');

    if (!year || !month || !day) return value;

    return `${day}-${month}-${year}`;
  } catch {
    return value;
  }
};

const money = (value: number) => {
  return `Rs ${Number(value || 0).toLocaleString()}`;
};

/* =========================================================
   VALUE HELPERS
========================================================= */

const getNumber = (...values: any[]) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const number = Number(value);

      if (!Number.isNaN(number)) {
        return number;
      }
    }
  }

  return 0;
};

const getText = (...values: any[]) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      return String(value).trim();
    }
  }

  return '';
};

const getDateOnly = (...values: any[]) => {
  const value = getText(...values);

  if (!value) return '';

  return value.substring(0, 10);
};

/* =========================================================
   PAGE
========================================================= */

export default function AllReportPage() {
  const [fromDate, setFromDate] = useState(
    getFirstDayOfMonth()
  );

  const [toDate, setToDate] = useState(
    getLocalToday()
  );

  const [incomeCategory, setIncomeCategory] =
    useState('all');

  const [expenseCategory, setExpenseCategory] =
    useState('all');

  const [incomeRows, setIncomeRows] = useState<ReportRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ReportRow[]>([]);

  const [expenseCategories, setExpenseCategories] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /* =========================================================
     INCOME CATEGORIES
  ========================================================= */

  const incomeCategories = [
    {
      value: 'all',
      label: 'تمام انکم'
    },
    {
      value: 'monthly_charges',
      label: 'ماہانہ چارجز'
    },
    {
      value: 'connection_charges',
      label: 'کنکشن چارجز'
    }
  ];

  /* =========================================================
     NORMALIZE INCOME CATEGORY
  ========================================================= */

  const normalizeIncomeCategory = (value: any) => {
    const text = String(value || '')
      .trim()
      .toLowerCase();

    if (
      text.includes('connection') ||
      text.includes('کنکشن')
    ) {
      return 'connection_charges';
    }

    return 'monthly_charges';
  };

  const incomeCategoryLabel = (value: string) => {
    if (value === 'connection_charges') {
      return 'کنکشن چارجز';
    }

    return 'ماہانہ چارجز';
  };

  /* =========================================================
     LOAD REPORT
  ========================================================= */

  const loadReport = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      if (!fromDate || !toDate) {
        throw new Error(
          'From Date اور To Date دونوں منتخب کریں۔'
        );
      }

      if (fromDate > toDate) {
        throw new Error(
          'From Date، To Date سے آگے نہیں ہو سکتی۔'
        );
      }

      /* =====================================================
         1. LOAD COLLECTIONS / INCOME

         We load records and normalize common field names.
      ===================================================== */

      const {
        data: collectionData,
        error: collectionError
      } = await supabase
        .from('collections')
        .select('*');

      if (collectionError) {
        throw new Error(
          `Income Error: ${collectionError.message}`
        );
      }

      const normalizedIncome: ReportRow[] =
        (collectionData || [])
          .map((item: any, index: number) => {
            const date = getDateOnly(
              item.payment_date,
              item.collection_date,
              item.paid_date,
              item.date,
              item.created_at
            );

            const rawCategory = getText(
              item.income_category,
              item.category,
              item.payment_category,
              item.collection_type,
              item.payment_type,
              item.fee_type
            );

            const category =
              normalizeIncomeCategory(rawCategory);

            const amount = getNumber(
              item.paid_amount,
              item.amount,
              item.received_amount,
              item.collection_amount
            );

            const customerName = getText(
              item.customer_name,
              item.full_name,
              item.name
            );

            const reference = getText(
              item.receipt_number,
              item.transaction_id,
              item.reference_number
            );

            return {
              id: item.id ?? `income-${index}`,
              type: 'income' as ReportType,
              date,
              category,
              description:
                getText(
                  item.description,
                  item.notes,
                  item.remarks
                ) ||
                incomeCategoryLabel(category),
              customerName,
              reference,
              amount
            };
          })
          .filter((item) => {
            if (!item.date) return false;

            return (
              item.date >= fromDate &&
              item.date <= toDate
            );
          });

      /* =====================================================
         2. LOAD EXPENSES
      ===================================================== */

      const {
        data: expenseData,
        error: expenseError
      } = await supabase
        .from('expenses')
        .select('*');

      if (expenseError) {
        throw new Error(
          `Expense Error: ${expenseError.message}`
        );
      }

      const normalizedExpenses: ReportRow[] =
        (expenseData || [])
          .map((item: any, index: number) => {
            const date = getDateOnly(
              item.expense_date,
              item.date,
              item.payment_date,
              item.created_at
            );

            const category =
              getText(
                item.category,
                item.expense_category,
                item.category_name,
                item.expense_type
              ) || 'Other';

            const amount = getNumber(
              item.amount,
              item.expense_amount,
              item.paid_amount
            );

            return {
              id: item.id ?? `expense-${index}`,
              type: 'expense' as ReportType,
              date,
              category,
              description:
                getText(
                  item.description,
                  item.title,
                  item.notes,
                  item.remarks,
                  item.details
                ) || category,
              reference: getText(
                item.reference_number,
                item.voucher_number,
                item.receipt_number
              ),
              amount
            };
          })
          .filter((item) => {
            if (!item.date) return false;

            return (
              item.date >= fromDate &&
              item.date <= toDate
            );
          });

      /* =====================================================
         EXPENSE CATEGORY LIST
      ===================================================== */

      const uniqueCategories = Array.from(
        new Set(
          normalizedExpenses
            .map(item => item.category)
            .filter(Boolean)
        )
      ).sort();

      setExpenseCategories(uniqueCategories);

      setIncomeRows(normalizedIncome);
      setExpenseRows(normalizedExpenses);

    } catch (err: any) {
      console.error('All Report Error:', err);

      setErrorMessage(
        err?.message ||
        'رپورٹ لوڈ کرنے میں خرابی پیش آئی۔'
      );

      setIncomeRows([]);
      setExpenseRows([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadReport();
  }, []);

  /* =========================================================
     FILTERED INCOME
  ========================================================= */

  const filteredIncome = useMemo(() => {
    if (incomeCategory === 'all') {
      return incomeRows;
    }

    return incomeRows.filter(
      item => item.category === incomeCategory
    );
  }, [incomeRows, incomeCategory]);

  /* =========================================================
     FILTERED EXPENSES
  ========================================================= */

  const filteredExpenses = useMemo(() => {
    if (expenseCategory === 'all') {
      return expenseRows;
    }

    return expenseRows.filter(
      item => item.category === expenseCategory
    );
  }, [expenseRows, expenseCategory]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const totalIncome = useMemo(() => {
    return filteredIncome.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );
  }, [filteredIncome]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const balance = totalIncome - totalExpense;

  const isProfit = balance >= 0;

  /* =========================================================
     COMBINED TRANSACTIONS
  ========================================================= */

  const allTransactions = useMemo(() => {
    return [
      ...filteredIncome,
      ...filteredExpenses
    ].sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
  }, [filteredIncome, filteredExpenses]);

  /* =========================================================
     RESET
  ========================================================= */

  const resetFilters = async () => {
    setFromDate(getFirstDayOfMonth());
    setToDate(getLocalToday());

    setIncomeCategory('all');
    setExpenseCategory('all');

    setTimeout(() => {
      loadReport();
    }, 0);
  };

  /* =========================================================
     STYLES
  ========================================================= */

  const cardStyle: React.CSSProperties = {
    background:
      'linear-gradient(145deg, #0b1b2e 0%, #0b2034 100%)',
    border: '1px solid #183a55',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,.15)'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#cbd5e1',
    marginBottom: '6px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#071525',
    border: '1px solid #1e4663',
    color: '#ffffff',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    colorScheme: 'dark'
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          width: '100%',
          maxWidth: '1450px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <div
          style={{
            ...cardStyle,
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(34,211,238,.12)',
                border: '1px solid rgba(34,211,238,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee'
              }}
            >
              <BarChart3 size={25} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: '#f8fafc',
                  fontSize: '19px',
                  fontWeight: 800
                }}
              >
                آل رپورٹ
              </h2>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#64748b',
                  fontSize: '11px'
                }}
              >
                Income • Expenses • Profit & Loss Report
              </p>
            </div>
          </div>

          <FileText
            size={22}
            color="#64748b"
          />
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {errorMessage && (
          <div
            style={{
              background: 'rgba(244,63,94,.10)',
              border: '1px solid rgba(244,63,94,.40)',
              color: '#fb7185',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px'
            }}
          >
            <AlertCircle size={17} />
            {errorMessage}
          </div>
        )}

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div
          style={{
            ...cardStyle,
            padding: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginBottom: '14px',
              color: '#67e8f9',
              fontSize: '13px',
              fontWeight: 800
            }}
          >
            <Filter size={16} />
            رپورٹ فلٹر
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '12px'
            }}
          >

            {/* FROM DATE */}

            <div>
              <label style={labelStyle}>
                تاریخ سے (From Date)
              </label>

              <input
                type="date"
                value={fromDate}
                max={toDate || getLocalToday()}
                onChange={e => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* TO DATE */}

            <div>
              <label style={labelStyle}>
                تاریخ تک (To Date)
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={getLocalToday()}
                onChange={e => setToDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* INCOME CATEGORY */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#34d399'
                }}
              >
                انکم کیٹیگری
              </label>

              <select
                value={incomeCategory}
                onChange={e =>
                  setIncomeCategory(e.target.value)
                }
                style={{
                  ...inputStyle,
                  border: '1px solid #065f46'
                }}
              >
                {incomeCategories.map(item => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* EXPENSE CATEGORY */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#fb7185'
                }}
              >
                خرچ کیٹیگری
              </label>

              <select
                value={expenseCategory}
                onChange={e =>
                  setExpenseCategory(e.target.value)
                }
                style={{
                  ...inputStyle,
                  border: '1px solid #881337'
                }}
              >
                <option value="all">
                  تمام اخراجات
                </option>

                {expenseCategories.map(category => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '14px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={resetFilters}
              disabled={loading}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '9px 15px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} />
              ری سیٹ
            </button>

            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              style={{
                background:
                  'linear-gradient(135deg, #0891b2, #2563eb)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '9px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: 800,
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
                <Search size={14} />
              )}

              {loading
                ? 'رپورٹ بن رہی ہے...'
                : 'رپورٹ دیکھیں'}
            </button>
          </div>
        </div>

        {/* ===================================================
            TOP SUMMARY
        =================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px'
          }}
        >

          {/* TOTAL INCOME */}

          <div
            style={{
              ...cardStyle,
              padding: '16px',
              border: '1px solid #065f46'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  کل انکم
                </div>

                <div
                  style={{
                    color: '#34d399',
                    fontSize: '22px',
                    fontWeight: 900,
                    marginTop: '4px'
                  }}
                >
                  {money(totalIncome)}
                </div>

                <div
                  style={{
                    color: '#64748b',
                    fontSize: '9px',
                    marginTop: '4px'
                  }}
                >
                  {filteredIncome.length} Transactions
                </div>
              </div>

              <ArrowUpCircle
                size={30}
                color="#34d399"
              />
            </div>
          </div>

          {/* TOTAL EXPENSE */}

          <div
            style={{
              ...cardStyle,
              padding: '16px',
              border: '1px solid #881337'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  کل خرچ
                </div>

                <div
                  style={{
                    color: '#fb7185',
                    fontSize: '22px',
                    fontWeight: 900,
                    marginTop: '4px'
                  }}
                >
                  {money(totalExpense)}
                </div>

                <div
                  style={{
                    color: '#64748b',
                    fontSize: '9px',
                    marginTop: '4px'
                  }}
                >
                  {filteredExpenses.length} Transactions
                </div>
              </div>

              <ArrowDownCircle
                size={30}
                color="#fb7185"
              />
            </div>
          </div>

          {/* BALANCE */}

          <div
            style={{
              ...cardStyle,
              padding: '16px',
              border: isProfit
                ? '1px solid #0e7490'
                : '1px solid #be123c'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  بیلنس
                </div>

                <div
                  style={{
                    color: isProfit
                      ? '#22d3ee'
                      : '#fb7185',
                    fontSize: '22px',
                    fontWeight: 900,
                    marginTop: '4px'
                  }}
                >
                  {money(Math.abs(balance))}
                </div>

                <div
                  style={{
                    color: isProfit
                      ? '#34d399'
                      : '#fb7185',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginTop: '4px'
                  }}
                >
                  {isProfit
                    ? 'PROFIT / منافع'
                    : 'LOSS / نقصان'}
                </div>
              </div>

              {isProfit ? (
                <TrendingUp
                  size={30}
                  color="#22d3ee"
                />
              ) : (
                <TrendingDown
                  size={30}
                  color="#fb7185"
                />
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            TRANSACTIONS
        =================================================== */}

        <div
          style={{
            ...cardStyle,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #183a55',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div
              style={{
                color: '#f8fafc',
                fontWeight: 800,
                fontSize: '13px'
              }}
            >
              انکم اور خرچ کی مکمل تفصیل
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '10px'
              }}
            >
              {formatDate(fromDate)} تا {formatDate(toDate)}
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div
            style={{
              width: '100%',
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#071525'
                  }}
                >
                  {[
                    'تاریخ',
                    'قسم',
                    'کیٹیگری',
                    'تفصیل',
                    'کسٹمر',
                    'ریفرنس',
                    'رقم'
                  ].map(title => (
                    <th
                      key={title}
                      style={{
                        padding: '11px',
                        textAlign: 'right',
                        color: '#94a3b8',
                        fontSize: '10px',
                        borderBottom:
                          '1px solid #183a55',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '35px',
                        textAlign: 'center',
                        color: '#67e8f9'
                      }}
                    >
                      <Loader2
                        size={22}
                        className="animate-spin"
                      />
                    </td>
                  </tr>
                ) : allTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '35px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '12px'
                      }}
                    >
                      منتخب تاریخ اور کیٹیگری میں کوئی ریکارڈ موجود نہیں۔
                    </td>
                  </tr>
                ) : (
                  allTransactions.map(item => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      style={{
                        borderBottom:
                          '1px solid #132c41'
                      }}
                    >
                      <td
                        style={{
                          padding: '11px',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatDate(item.date)}
                      </td>

                      <td
                        style={{
                          padding: '11px'
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '20px',
                            fontSize: '9px',
                            fontWeight: 800,
                            color:
                              item.type === 'income'
                                ? '#34d399'
                                : '#fb7185',
                            background:
                              item.type === 'income'
                                ? 'rgba(16,185,129,.10)'
                                : 'rgba(244,63,94,.10)',
                            border:
                              item.type === 'income'
                                ? '1px solid rgba(16,185,129,.30)'
                                : '1px solid rgba(244,63,94,.30)'
                          }}
                        >
                          {item.type === 'income'
                            ? 'INCOME'
                            : 'EXPENSE'}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          color: '#e2e8f0',
                          fontSize: '11px'
                        }}
                      >
                        {item.type === 'income'
                          ? incomeCategoryLabel(item.category)
                          : item.category}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          color: '#94a3b8',
                          fontSize: '11px'
                        }}
                      >
                        {item.description || '---'}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          color: '#94a3b8',
                          fontSize: '11px'
                        }}
                      >
                        {item.customerName || '---'}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          color: '#64748b',
                          fontSize: '10px',
                          direction: 'ltr'
                        }}
                      >
                        {item.reference || '---'}
                      </td>

                      <td
                        style={{
                          padding: '11px',
                          fontWeight: 800,
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          color:
                            item.type === 'income'
                              ? '#34d399'
                              : '#fb7185'
                        }}
                      >
                        {item.type === 'income'
                          ? '+ '
                          : '- '}
                        {money(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================================================
            FINAL PROFIT / LOSS
        =================================================== */}

        <div
          style={{
            ...cardStyle,
            padding: '18px',
            border: isProfit
              ? '1px solid rgba(16,185,129,.40)'
              : '1px solid rgba(244,63,94,.40)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px'
            }}
          >
            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px'
                }}
              >
                کل انکم
              </div>

              <div
                style={{
                  color: '#34d399',
                  fontSize: '18px',
                  fontWeight: 900
                }}
              >
                {money(totalIncome)}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px'
                }}
              >
                کل خرچ
              </div>

              <div
                style={{
                  color: '#fb7185',
                  fontSize: '18px',
                  fontWeight: 900
                }}
              >
                {money(totalExpense)}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px'
                }}
              >
                Profit / Loss
              </div>

              <div
                style={{
                  color: isProfit
                    ? '#22d3ee'
                    : '#fb7185',
                  fontSize: '20px',
                  fontWeight: 900
                }}
              >
                {isProfit ? '+' : '-'}{' '}
                {money(Math.abs(balance))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}