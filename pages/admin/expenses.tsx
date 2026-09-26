import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  PieChart,
  CalendarDays,
  FileText,
  Tags
} from 'lucide-react';

interface ExpenseType {
  id: number;
  expense_date: string;
  voucher_no: string | null;
  category: string;
  description: string | null;
  amount: number;
  created_at: string;
}

interface ExpenseCategoryType {
  id: number;
  name: string;
  is_active: boolean;
}

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

const generateVoucher = () => {
  const now = new Date();

  const stamp =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const random = Math.floor(10 + Math.random() * 90);

  return `EXP-${stamp}-${random}`;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryType[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    date: getToday(),
    voucherNo: generateVoucher(),
    category: '',
    description: '',
    amount: ''
  });

  /* =====================================================
     LOAD EXPENSE CATEGORIES
  ===================================================== */

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Expense Categories Error:', error);

      setErrorMessage(
        `خرچ کی کیٹیگریز لوڈ نہیں ہو سکیں: ${error.message}`
      );

      return;
    }

    const list = (data || []) as ExpenseCategoryType[];

    setCategories(list);

    setFormData(prev => {
      if (prev.category || list.length === 0) {
        return prev;
      }

      return {
        ...prev,
        category: list[0].name
      };
    });
  };

  /* =====================================================
     LOAD EXPENSES
  ===================================================== */

  const fetchExpenses = async () => {
    setFetching(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, expense_date, voucher_no, category, description, amount, created_at'
        )
        .order('expense_date', { ascending: false })
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      setExpenses(
        (data || []).map((item: any) => ({
          ...item,
          amount: Number(item.amount || 0)
        }))
      );
    } catch (err: any) {
      setErrorMessage(
        `اخراجات لوڈ کرنے میں خرابی: ${
          err?.message || 'Unknown error'
        }`
      );
    } finally {
      setFetching(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchExpenses()
    ]);
  }, []);

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setErrorMessage('');
  };

  /* =====================================================
     ADD EXPENSE
  ===================================================== */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (loading) return;

    const amount = Number(formData.amount);

    if (!formData.date) {
      setErrorMessage('خرچ کی تاریخ منتخب کریں۔');
      return;
    }

    if (!formData.category) {
      setErrorMessage('خرچ کی کیٹیگری منتخب کریں۔');
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMessage('درست خرچ کی رقم درج کریں۔');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      const voucher =
        formData.voucherNo.trim() ||
        generateVoucher();

      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            expense_date: formData.date,
            voucher_no: voucher,
            category: formData.category,
            description:
              formData.description.trim() || null,
            amount
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error(
            'یہ واؤچر نمبر پہلے سے موجود ہے۔ نیا واؤچر نمبر استعمال کریں۔'
          );
        }

        throw error;
      }

      setIsSuccess(true);

      setFormData({
        date: getToday(),
        voucherNo: generateVoucher(),
        category:
          categories.length > 0
            ? categories[0].name
            : '',
        description: '',
        amount: ''
      });

      await fetchExpenses();

      setTimeout(() => {
        setIsSuccess(false);
      }, 3500);

    } catch (err: any) {
      setErrorMessage(
        `خرچ محفوظ نہیں ہو سکا: ${
          err?.message || 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     DELETE EXPENSE
  ===================================================== */

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'کیا آپ واقعی یہ خرچ حذف کرنا چاہتے ہیں؟'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setExpenses(prev =>
        prev.filter(item => item.id !== id)
      );

    } catch (err: any) {
      setErrorMessage(
        `خرچ حذف نہیں ہو سکا: ${
          err?.message || 'Unknown error'
        }`
      );
    }
  };

  /* =====================================================
     TOTAL
  ===================================================== */

  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [expenses]);

  /* =====================================================
     CURRENT MONTH TOTAL
  ===================================================== */

  const currentMonthExpense = useMemo(() => {
    const today = getToday();
    const currentMonth = today.substring(0, 7);

    return expenses
      .filter(item =>
        String(item.expense_date).startsWith(
          currentMonth
        )
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );
  }, [expenses]);

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#ffffff',
    padding: '10px 11px',
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
              'linear-gradient(135deg, #1c2541, #111c35)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid #ef4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
                backgroundColor:
                  'rgba(239,68,68,.15)',
                padding: '10px',
                borderRadius: '11px',
                color: '#f87171'
              }}
            >
              <DollarSign size={22} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  color: '#ffffff'
                }}
              >
                روزمرہ اخراجات
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '10px',
                  color: '#94a3b8'
                }}
              >
                Daily Expenses Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchCategories();
              fetchExpenses();
            }}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px'
            }}
          >
            <RefreshCw
              size={13}
              className={
                fetching ? 'animate-spin' : ''
              }
            />

            ریفریش
          </button>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px,1fr))',
            gap: '10px'
          }}
        >

          <div
            style={{
              backgroundColor: '#1c2541',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                color: '#94a3b8'
              }}
            >
              کل مجموعی اخراجات
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: '#f87171',
                fontSize: '21px'
              }}
            >
              Rs {totalExpense.toLocaleString()}
            </h2>
          </div>

          <div
            style={{
              backgroundColor: '#1c2541',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                color: '#94a3b8'
              }}
            >
              موجودہ ماہ کا خرچ
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: '#fbbf24',
                fontSize: '21px'
              }}
            >
              Rs {currentMonthExpense.toLocaleString()}
            </h2>
          </div>

          <div
            style={{
              backgroundColor: '#1c2541',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                color: '#94a3b8'
              }}
            >
              کل Expense Entries
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: '#38bdf8',
                fontSize: '21px'
              }}
            >
              {expenses.length}
            </h2>
          </div>

          <div
            style={{
              backgroundColor: '#1c2541',
              border: '1px solid #a78bfa',
              borderRadius: '12px',
              padding: '15px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                color: '#94a3b8'
              }}
            >
              Expense Categories
            </p>

            <h2
              style={{
                margin: '5px 0 0',
                color: '#a78bfa',
                fontSize: '21px'
              }}
            >
              {categories.length}
            </h2>
          </div>
        </div>

        {/* SUCCESS */}

        {isSuccess && (
          <div
            style={{
              background:
                'rgba(16,185,129,.12)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '11px 14px',
              borderRadius: '10px',
              display: 'flex',
              gap: '7px',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <CheckCircle2 size={16} />
            خرچ کامیابی سے محفوظ ہو گیا ہے۔
          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(239,68,68,.12)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '11px 14px',
              borderRadius: '10px',
              display: 'flex',
              gap: '7px',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '14px',
            padding: '17px',
            border: '1px solid #334155'
          }}
        >
          <h3
            style={{
              margin: '0 0 15px',
              fontSize: '14px',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            نیا خرچ درج کریں
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(190px,1fr))',
              gap: '12px'
            }}
          >

            <div>
              <label style={labelStyle}>
                تاریخ
              </label>

              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                واؤچر نمبر
              </label>

              <input
                type="text"
                name="voucherNo"
                value={formData.voucherNo}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  direction: 'ltr',
                  color: '#38bdf8'
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                خرچ کی کیٹیگری *
              </label>

              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  border: '1px solid #a78bfa'
                }}
              >
                <option value="">
                  کیٹیگری منتخب کریں
                </option>

                {categories.map(category => (
                  <option
                    key={category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#f87171'
                }}
              >
                رقم (Rs) *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="1"
                step="0.01"
                placeholder="0"
                value={formData.amount}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <div
              style={{
                gridColumn: '1 / -1'
              }}
            >
              <label style={labelStyle}>
                خرچ کی تفصیل
              </label>

              <textarea
                name="description"
                rows={3}
                placeholder="خرچ کی مکمل یا مختصر تفصیل..."
                value={formData.description}
                onChange={handleChange}
                style={{
                  ...fieldStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '14px'
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                background:
                  'linear-gradient(135deg,#dc2626,#ef4444)',
                color: '#ffffff',
                border: 0,
                padding: '10px 20px',
                borderRadius: '9px',
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
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
                <Plus size={14} />
              )}

              {loading
                ? 'محفوظ ہو رہا ہے...'
                : 'خرچ محفوظ کریں'}
            </button>
          </div>
        </form>

        {/* HISTORY */}

        <div
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '14px',
            border: '1px solid #334155',
            padding: '14px',
            overflowX: 'auto'
          }}
        >
          <h3
            style={{
              margin: '0 0 12px',
              color: '#f472b6',
              fontSize: '14px'
            }}
          >
            اخراجات کا مکمل ریکارڈ
          </h3>

          {fetching ? (
            <div
              style={{
                padding: '25px',
                textAlign: 'center',
                color: '#38bdf8'
              }}
            >
              <Loader2
                size={20}
                className="animate-spin"
              />
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                minWidth: '750px',
                borderCollapse: 'collapse',
                textAlign: 'right',
                fontSize: '11px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#94a3b8'
                  }}
                >
                  <th style={{ padding: '9px' }}>#</th>
                  <th style={{ padding: '9px' }}>تاریخ</th>
                  <th style={{ padding: '9px' }}>واؤچر</th>
                  <th style={{ padding: '9px' }}>کیٹیگری</th>
                  <th style={{ padding: '9px' }}>تفصیل</th>
                  <th style={{ padding: '9px' }}>رقم</th>
                  <th style={{ padding: '9px' }}>ایکشن</th>
                </tr>
              </thead>

              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: '25px',
                        color: '#64748b'
                      }}
                    >
                      کوئی خرچ موجود نہیں۔
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp, index) => (
                    <tr
                      key={exp.id}
                      style={{
                        borderBottom:
                          '1px solid #1e293b'
                      }}
                    >
                      <td style={{ padding: '9px' }}>
                        {index + 1}
                      </td>

                      <td style={{ padding: '9px' }}>
                        {exp.expense_date}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#38bdf8'
                        }}
                      >
                        {exp.voucher_no || '---'}
                      </td>

                      <td style={{ padding: '9px' }}>
                        <span
                          style={{
                            background: '#0f172a',
                            border:
                              '1px solid #334155',
                            borderRadius: '5px',
                            padding: '3px 7px'
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#94a3b8'
                        }}
                      >
                        {exp.description || '---'}
                      </td>

                      <td
                        style={{
                          padding: '9px',
                          color: '#f87171',
                          fontWeight: 'bold'
                        }}
                      >
                        Rs{' '}
                        {Number(
                          exp.amount
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: '9px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(exp.id)
                          }
                          style={{
                            background:
                              'rgba(239,68,68,.15)',
                            color: '#f87171',
                            border:
                              '1px solid rgba(239,68,68,.4)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}