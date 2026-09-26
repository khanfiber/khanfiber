import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  X,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface IncomeType {
  id: number;
  income_date: string;
  category: string;
  amount: number;
  description?: string | null;
  customer_name?: string | null;
  reference_no?: string | null;
  created_at?: string;
}

interface ExpenseType {
  id: number;
  expense_date: string;
  voucher_no?: string | null;
  category: string;
  description?: string | null;
  amount: number;
  created_at?: string;
}

interface ExpenseCategoryType {
  id: number;
  name: string;
  is_active: boolean;
}

interface MultiSelectProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  accentColor: string;
}

/* =========================================================
   DATE HELPERS
========================================================= */

const getToday = () => {
  const now = new Date();

  const offset = now.getTimezoneOffset();

  const localDate = new Date(
    now.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().split('T')[0];
};

const getMonthStart = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  return `${year}-${month}-01`;
};

/* =========================================================
   FORMAT MONEY
========================================================= */

const formatMoney = (amount: number) => {
  return Number(amount || 0).toLocaleString(
    'en-PK',
    {
      maximumFractionDigits: 2
    }
  );
};

/* =========================================================
   MULTI SELECT COMPONENT
========================================================= */

function MultiSelect({
  title,
  options,
  selected,
  onChange,
  accentColor
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const allSelected =
    options.length > 0 &&
    selected.length === options.length;

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(
        selected.filter(item => item !== option)
      );
    } else {
      onChange([...selected, option]);
    }
  };

  const displayText = (() => {
    if (selected.length === 0) {
      return 'کوئی کیٹیگری منتخب نہیں';
    }

    if (allSelected) {
      return 'تمام کیٹیگریز';
    }

    if (selected.length === 1) {
      return selected[0];
    }

    return `${selected.length} کیٹیگریز منتخب`;
  })();

  return (
    <div
      style={{
        position: 'relative'
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: '700',
          color: '#e2e8f0',
          marginBottom: '5px'
        }}
      >
        {title}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          minHeight: '42px',
          backgroundColor: '#0f172a',
          border: `1px solid ${accentColor}`,
          color: '#ffffff',
          borderRadius: '9px',
          padding: '9px 11px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          boxSizing: 'border-box'
        }}
      >
        <span>{displayText}</span>

        <ChevronDown
          size={15}
          style={{
            transform: open
              ? 'rotate(180deg)'
              : 'rotate(0deg)',
            transition: '.2s'
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            right: 0,
            left: 0,
            zIndex: 100,
            backgroundColor: '#071525',
            border: `1px solid ${accentColor}`,
            borderRadius: '10px',
            boxShadow:
              '0 15px 35px rgba(0,0,0,.45)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '7px'
          }}
        >
          {/* ALL */}

          <div
            onClick={toggleAll}
            style={{
              padding: '9px',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: allSelected
                ? 'rgba(59,130,246,.12)'
                : 'transparent',
              marginBottom: '4px'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: `1px solid ${accentColor}`,
                backgroundColor: allSelected
                  ? accentColor
                  : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {allSelected && (
                <Check
                  size={12}
                  color="#ffffff"
                />
              )}
            </div>

            <span
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              تمام کیٹیگریز
            </span>
          </div>

          <div
            style={{
              height: '1px',
              backgroundColor: '#1e293b',
              margin: '5px 0'
            }}
          />

          {/* INDIVIDUAL OPTIONS */}

          {options.map(option => {
            const checked =
              selected.includes(option);

            return (
              <div
                key={option}
                onClick={() =>
                  toggleOption(option)
                }
                style={{
                  padding: '9px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: checked
                    ? 'rgba(255,255,255,.05)'
                    : 'transparent'
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: `1px solid ${accentColor}`,
                    backgroundColor: checked
                      ? accentColor
                      : '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {checked && (
                    <Check
                      size={12}
                      color="#ffffff"
                    />
                  )}
                </div>

                <span
                  style={{
                    color: '#e2e8f0',
                    fontSize: '12px'
                  }}
                >
                  {option}
                </span>
              </div>
            );
          })}

          {options.length === 0 && (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '11px'
              }}
            >
              کوئی کیٹیگری موجود نہیں۔
            </div>
          )}
        </div>
      )}

      {/* SELECTED CHIPS */}

      {selected.length > 0 &&
        !allSelected && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: '6px'
            }}
          >
            {selected.map(item => (
              <span
                key={item}
                style={{
                  backgroundColor:
                    'rgba(15,23,42,.8)',
                  border: `1px solid ${accentColor}`,
                  color: '#cbd5e1',
                  borderRadius: '20px',
                  padding: '3px 7px',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {item}

                <X
                  size={9}
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() =>
                    toggleOption(item)
                  }
                />
              </span>
            ))}
          </div>
        )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AllReportPage() {
  /* =======================================================
     INCOME CATEGORIES
  ======================================================= */

  const incomeCategories = [
    'ماہانہ چارجز',
    'کنکشن چارجز'
  ];

  /* =======================================================
     STATES
  ======================================================= */

  const [fromDate, setFromDate] =
    useState(getMonthStart());

  const [toDate, setToDate] =
    useState(getToday());

  const [
    expenseCategories,
    setExpenseCategories
  ] = useState<ExpenseCategoryType[]>([]);

  const [
    selectedIncomeCategories,
    setSelectedIncomeCategories
  ] = useState<string[]>([
    ...incomeCategories
  ]);

  const [
    selectedExpenseCategories,
    setSelectedExpenseCategories
  ] = useState<string[]>([]);

  const [incomeRecords, setIncomeRecords] =
    useState<IncomeType[]>([]);

  const [expenseRecords, setExpenseRecords] =
    useState<ExpenseType[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =======================================================
     LOAD EXPENSE CATEGORIES
  ======================================================= */

  const loadExpenseCategories =
    async (): Promise<string[]> => {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('name', {
            ascending: true
          });

        if (error) {
          throw error;
        }

        const cleanData =
          (data || []) as ExpenseCategoryType[];

        setExpenseCategories(cleanData);

        const names = cleanData.map(
          item => item.name
        );

        setSelectedExpenseCategories(
          prev =>
            prev.length > 0
              ? prev
              : names
        );

        return names;
      } catch (err: any) {
        console.error(
          'Expense Category Error:',
          err
        );

        setErrorMessage(
          `خرچ کی کیٹیگریز لوڈ نہیں ہو سکیں: ${
            err?.message || 'Unknown error'
          }`
        );

        return [];
      }
    };

  /* =======================================================
     FETCH REPORT
  ======================================================= */

  const fetchReport = async (
    expenseCategoryNames?: string[]
  ) => {
    if (!fromDate || !toDate) {
      setErrorMessage(
        'From Date اور To Date منتخب کریں۔'
      );
      return;
    }

    if (fromDate > toDate) {
      setErrorMessage(
        'From Date، To Date سے بڑی نہیں ہو سکتی۔'
      );
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      /* ===================================================
         INCOME

         Assumed income table structure:

         income
         id
         income_date
         category
         amount
         description
         customer_name
         reference_no

         If your table is named incomes instead,
         change .from('income') to .from('incomes')
      =================================================== */

      let incomeData: any[] = [];

      if (
        selectedIncomeCategories.length > 0
      ) {
        let incomeQuery = supabase
          .from('income')
          .select('*')
          .gte('income_date', fromDate)
          .lte('income_date', toDate);

        /*
          Only filter when not all selected.
        */

        if (
          selectedIncomeCategories.length !==
          incomeCategories.length
        ) {
          incomeQuery = incomeQuery.in(
            'category',
            selectedIncomeCategories
          );
        }

        const {
          data,
          error: incomeError
        } = await incomeQuery.order(
          'income_date',
          {
            ascending: false
          }
        );

        if (incomeError) {
          throw new Error(
            `Income Error: ${incomeError.message}`
          );
        }

        incomeData = data || [];
      }

      /* ===================================================
         EXPENSE
      =================================================== */

      const currentExpenseSelection =
        expenseCategoryNames ||
        selectedExpenseCategories;

      let expenseData: any[] = [];

      if (
        currentExpenseSelection.length > 0
      ) {
        let expenseQuery = supabase
          .from('expenses')
          .select(
            'id, expense_date, voucher_no, category, description, amount, created_at'
          )
          .gte('expense_date', fromDate)
          .lte('expense_date', toDate);

        const allExpenseCategories =
          expenseCategories.length > 0
            ? expenseCategories.map(
                item => item.name
              )
            : currentExpenseSelection;

        /*
          If only some categories selected,
          use IN filter.
        */

        if (
          currentExpenseSelection.length !==
          allExpenseCategories.length
        ) {
          expenseQuery = expenseQuery.in(
            'category',
            currentExpenseSelection
          );
        }

        const {
          data,
          error: expenseError
        } = await expenseQuery.order(
          'expense_date',
          {
            ascending: false
          }
        );

        if (expenseError) {
          throw new Error(
            `Expense Error: ${expenseError.message}`
          );
        }

        expenseData = data || [];
      }

      /* ===================================================
         CLEAN INCOME DATA
      =================================================== */

      const cleanIncome: IncomeType[] =
        incomeData.map((item: any) => ({
          id: Number(item.id),
          income_date:
            item.income_date || '',
          category:
            item.category || '',
          amount: Number(item.amount || 0),
          description:
            item.description || null,
          customer_name:
            item.customer_name || null,
          reference_no:
            item.reference_no || null,
          created_at:
            item.created_at
        }));

      /* ===================================================
         CLEAN EXPENSE DATA
      =================================================== */

      const cleanExpenses: ExpenseType[] =
        expenseData.map((item: any) => ({
          id: Number(item.id),
          expense_date:
            item.expense_date || '',
          voucher_no:
            item.voucher_no || null,
          category:
            item.category || '',
          description:
            item.description || null,
          amount: Number(item.amount || 0),
          created_at:
            item.created_at
        }));

      setIncomeRecords(cleanIncome);
      setExpenseRecords(cleanExpenses);

    } catch (err: any) {
      console.error(
        'All Report Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'رپورٹ لوڈ کرنے میں خرابی پیش آئی۔'
      );

      setIncomeRecords([]);
      setExpenseRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);

      const names =
        await loadExpenseCategories();

      await fetchReport(names);

      setInitialLoading(false);
    };

    initialize();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const totalIncome = useMemo(() => {
    return incomeRecords.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [incomeRecords]);

  const totalExpense = useMemo(() => {
    return expenseRecords.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [expenseRecords]);

  const balance =
    totalIncome - totalExpense;

  const isProfit = balance >= 0;

  /* =======================================================
     CATEGORY TOTALS
  ======================================================= */

  const monthlyChargesTotal =
    useMemo(() => {
      return incomeRecords
        .filter(
          item =>
            item.category ===
            'ماہانہ چارجز'
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );
    }, [incomeRecords]);

  const connectionChargesTotal =
    useMemo(() => {
      return incomeRecords
        .filter(
          item =>
            item.category ===
            'کنکشن چارجز'
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );
    }, [incomeRecords]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setFromDate(getMonthStart());
    setToDate(getToday());

    setSelectedIncomeCategories([
      ...incomeCategories
    ]);

    setSelectedExpenseCategories(
      expenseCategories.map(
        item => item.name
      )
    );
  };

  /* =======================================================
     COMMON STYLE
  ======================================================= */

  const dateInputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#ffffff',
    padding: '10px',
    borderRadius: '9px',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '5px'
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          width: '100%',
          maxWidth: '1450px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            background:
              'linear-gradient(135deg,#111c35,#1c2541)',
            border: '1px solid #8b5cf6',
            borderRadius: '15px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px'
            }}
          >
            <div
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '11px',
                background:
                  'rgba(139,92,246,.15)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border:
                  '1px solid rgba(139,92,246,.35)'
              }}
            >
              <BarChart3 size={23} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '17px'
                }}
              >
                آل رپورٹ
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  color: '#94a3b8',
                  fontSize: '10px'
                }}
              >
                Income • Expenses • Profit & Loss
              </p>
            </div>
          </div>

          <div
            style={{
              color: '#a78bfa',
              fontSize: '11px'
            }}
          >
            One Click • Haider Fiber Network
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div
          style={{
            backgroundColor: '#1c2541',
            border:
              '1px solid #334155',
            borderRadius: '14px',
            padding: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '13px',
              color: '#38bdf8'
            }}
          >
            <Filter size={15} />

            <span
              style={{
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              رپورٹ فلٹر
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(210px,1fr))',
              gap: '12px',
              alignItems: 'start'
            }}
          >

            {/* FROM DATE */}

            <div>
              <label style={labelStyle}>
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={e =>
                  setFromDate(
                    e.target.value
                  )
                }
                style={dateInputStyle}
              />
            </div>

            {/* TO DATE */}

            <div>
              <label style={labelStyle}>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={e =>
                  setToDate(
                    e.target.value
                  )
                }
                style={dateInputStyle}
              />
            </div>

            {/* INCOME MULTI SELECT */}

            <MultiSelect
              title="انکم کیٹیگری"
              options={incomeCategories}
              selected={
                selectedIncomeCategories
              }
              onChange={
                setSelectedIncomeCategories
              }
              accentColor="#10b981"
            />

            {/* EXPENSE MULTI SELECT */}

            <MultiSelect
              title="خرچ کیٹیگری"
              options={expenseCategories.map(
                item => item.name
              )}
              selected={
                selectedExpenseCategories
              }
              onChange={
                setSelectedExpenseCategories
              }
              accentColor="#ef4444"
            />
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '15px'
            }}
          >
            <button
              type="button"
              onClick={resetFilters}
              style={{
                backgroundColor: '#0f172a',
                color: '#94a3b8',
                border:
                  '1px solid #334155',
                borderRadius: '8px',
                padding: '9px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px'
              }}
            >
              <RefreshCw size={13} />
              ری سیٹ
            </button>

            <button
              type="button"
              onClick={() =>
                fetchReport()
              }
              disabled={loading}
              style={{
                background:
                  'linear-gradient(135deg,#2563eb,#0891b2)',
                color: '#ffffff',
                border: 0,
                borderRadius: '8px',
                padding: '9px 18px',
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 'bold'
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

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(239,68,68,.12)',
              border:
                '1px solid #ef4444',
              color: '#f87171',
              padding: '11px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '11px'
            }}
          >
            <AlertCircle size={16} />

            {errorMessage}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(190px,1fr))',
            gap: '10px'
          }}
        >

          {/* TOTAL INCOME */}

          <div
            style={{
              backgroundColor: '#1c2541',
              border:
                '1px solid #10b981',
              borderRadius: '13px',
              padding: '15px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#94a3b8',
                    fontSize: '10px'
                  }}
                >
                  کل انکم
                </p>

                <h2
                  style={{
                    margin: '5px 0 0',
                    color: '#34d399',
                    fontSize: '20px'
                  }}
                >
                  Rs {formatMoney(totalIncome)}
                </h2>
              </div>

              <ArrowUpCircle
                size={25}
                color="#34d399"
              />
            </div>
          </div>

          {/* TOTAL EXPENSE */}

          <div
            style={{
              backgroundColor: '#1c2541',
              border:
                '1px solid #ef4444',
              borderRadius: '13px',
              padding: '15px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#94a3b8',
                    fontSize: '10px'
                  }}
                >
                  کل خرچ
                </p>

                <h2
                  style={{
                    margin: '5px 0 0',
                    color: '#f87171',
                    fontSize: '20px'
                  }}
                >
                  Rs {formatMoney(totalExpense)}
                </h2>
              </div>

              <ArrowDownCircle
                size={25}
                color="#f87171"
              />
            </div>
          </div>

          {/* BALANCE */}

          <div
            style={{
              backgroundColor: '#1c2541',
              border: `1px solid ${
                isProfit
                  ? '#3b82f6'
                  : '#f59e0b'
              }`,
              borderRadius: '13px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '10px'
              }}
            >
              نیٹ بیلنس
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: isProfit
                  ? '#60a5fa'
                  : '#fbbf24',
                fontSize: '20px'
              }}
            >
              Rs {formatMoney(balance)}
            </h2>
          </div>

          {/* PROFIT LOSS */}

          <div
            style={{
              backgroundColor: '#1c2541',
              border: `1px solid ${
                isProfit
                  ? '#10b981'
                  : '#ef4444'
              }`,
              borderRadius: '13px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '10px'
              }}
            >
              نتیجہ
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: isProfit
                  ? '#34d399'
                  : '#f87171',
                fontSize: '20px'
              }}
            >
              {isProfit
                ? 'PROFIT'
                : 'LOSS'}
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                color: isProfit
                  ? '#34d399'
                  : '#f87171',
                fontSize: '10px'
              }}
            >
              Rs {formatMoney(
                Math.abs(balance)
              )}
            </p>
          </div>
        </div>

        {/* =================================================
            INCOME CATEGORY SUMMARY
        ================================================= */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(220px,1fr))',
            gap: '10px'
          }}
        >
          <div
            style={{
              backgroundColor: '#111c35',
              border:
                '1px solid #10b981',
              borderRadius: '11px',
              padding: '12px'
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '10px'
              }}
            >
              ماہانہ چارجز وصولی
            </p>

            <strong
              style={{
                color: '#34d399',
                fontSize: '16px'
              }}
            >
              Rs{' '}
              {formatMoney(
                monthlyChargesTotal
              )}
            </strong>
          </div>

          <div
            style={{
              backgroundColor: '#111c35',
              border:
                '1px solid #06b6d4',
              borderRadius: '11px',
              padding: '12px'
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '10px'
              }}
            >
              کنکشن چارجز وصولی
            </p>

            <strong
              style={{
                color: '#22d3ee',
                fontSize: '16px'
              }}
            >
              Rs{' '}
              {formatMoney(
                connectionChargesTotal
              )}
            </strong>
          </div>
        </div>

        {/* =================================================
            INCOME TABLE
        ================================================= */}

        <div
          style={{
            backgroundColor: '#1c2541',
            border:
              '1px solid #10b981',
            borderRadius: '14px',
            padding: '14px',
            overflowX: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginBottom: '11px'
            }}
          >
            <TrendingUp
              size={17}
              color="#34d399"
            />

            <h3
              style={{
                margin: 0,
                color: '#34d399',
                fontSize: '14px'
              }}
            >
              انکم ریکارڈ
            </h3>
          </div>

          <table
            style={{
              width: '100%',
              minWidth: '700px',
              borderCollapse: 'collapse',
              fontSize: '11px',
              textAlign: 'right'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#0f172a',
                  color: '#94a3b8'
                }}
              >
                <th style={{ padding: '9px' }}>
                  #
                </th>

                <th style={{ padding: '9px' }}>
                  تاریخ
                </th>

                <th style={{ padding: '9px' }}>
                  کیٹیگری
                </th>

                <th style={{ padding: '9px' }}>
                  کسٹمر
                </th>

                <th style={{ padding: '9px' }}>
                  تفصیل
                </th>

                <th style={{ padding: '9px' }}>
                  رقم
                </th>
              </tr>
            </thead>

            <tbody>
              {incomeRecords.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '22px',
                      textAlign: 'center',
                      color: '#64748b'
                    }}
                  >
                    منتخب فلٹر میں کوئی انکم
                    ریکارڈ موجود نہیں۔
                  </td>
                </tr>
              ) : (
                incomeRecords.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          '1px solid #1e293b'
                      }}
                    >
                      <td
                        style={{
                          padding: '9px',
                          color: '#64748b'
                        }}
                      >
                        {index + 1}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#cbd5e1'
                        }}
                      >
                        {item.income_date}
                      </td>

                      <td
                        style={{
                          padding: '9px'
                        }}
                      >
                        <span
                          style={{
                            background:
                              'rgba(16,185,129,.1)',
                            border:
                              '1px solid rgba(16,185,129,.3)',
                            color: '#34d399',
                            padding: '3px 7px',
                            borderRadius: '5px'
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#ffffff'
                        }}
                      >
                        {item.customer_name ||
                          '---'}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#94a3b8'
                        }}
                      >
                        {item.description ||
                          '---'}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#34d399',
                          fontWeight: 'bold'
                        }}
                      >
                        Rs{' '}
                        {formatMoney(
                          item.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            EXPENSE TABLE
        ================================================= */}

        <div
          style={{
            backgroundColor: '#1c2541',
            border:
              '1px solid #ef4444',
            borderRadius: '14px',
            padding: '14px',
            overflowX: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginBottom: '11px'
            }}
          >
            <TrendingDown
              size={17}
              color="#f87171"
            />

            <h3
              style={{
                margin: 0,
                color: '#f87171',
                fontSize: '14px'
              }}
            >
              اخراجات کا ریکارڈ
            </h3>
          </div>

          <table
            style={{
              width: '100%',
              minWidth: '750px',
              borderCollapse: 'collapse',
              fontSize: '11px',
              textAlign: 'right'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#0f172a',
                  color: '#94a3b8'
                }}
              >
                <th style={{ padding: '9px' }}>
                  #
                </th>

                <th style={{ padding: '9px' }}>
                  تاریخ
                </th>

                <th style={{ padding: '9px' }}>
                  واؤچر
                </th>

                <th style={{ padding: '9px' }}>
                  کیٹیگری
                </th>

                <th style={{ padding: '9px' }}>
                  تفصیل
                </th>

                <th style={{ padding: '9px' }}>
                  رقم
                </th>
              </tr>
            </thead>

            <tbody>
              {expenseRecords.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '22px',
                      textAlign: 'center',
                      color: '#64748b'
                    }}
                  >
                    منتخب فلٹر میں کوئی خرچ
                    موجود نہیں۔
                  </td>
                </tr>
              ) : (
                expenseRecords.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          '1px solid #1e293b'
                      }}
                    >
                      <td
                        style={{
                          padding: '9px',
                          color: '#64748b'
                        }}
                      >
                        {index + 1}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#cbd5e1'
                        }}
                      >
                        {item.expense_date}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#38bdf8'
                        }}
                      >
                        {item.voucher_no ||
                          '---'}
                      </td>

                      <td
                        style={{
                          padding: '9px'
                        }}
                      >
                        <span
                          style={{
                            background:
                              'rgba(239,68,68,.1)',
                            border:
                              '1px solid rgba(239,68,68,.3)',
                            color: '#f87171',
                            padding: '3px 7px',
                            borderRadius: '5px'
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#94a3b8'
                        }}
                      >
                        {item.description ||
                          '---'}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#f87171',
                          fontWeight: 'bold'
                        }}
                      >
                        Rs{' '}
                        {formatMoney(
                          item.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {(loading ||
          initialLoading) && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              backgroundColor: '#0f172a',
              border:
                '1px solid #3b82f6',
              color: '#38bdf8',
              padding: '9px 13px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              boxShadow:
                '0 10px 25px rgba(0,0,0,.35)',
              zIndex: 200
            }}
          >
            <Loader2
              size={14}
              className="animate-spin"
            />

            رپورٹ لوڈ ہو رہی ہے...
          </div>
        )}
      </div>
    </Layout>
  );
}