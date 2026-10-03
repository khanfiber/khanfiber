import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  CreditCard
} from 'lucide-react';

interface UserType {
  id: number;
  serial_number: string;
  full_name: string;
  father_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  cnic: string;
  address: string;
  pppoe_username: string;
  pppoe_password: string;
  monthly_price: number;
  connection_charges: number;
  package_name: string;
  speed: string;
  created_at: string;
}

export default function UserList() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(true);

  const [viewUser, setViewUser] = useState<UserType | null>(null);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  const fetchUsers = async () => {
    setFetching(true);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        alert('یوزر لسٹ لوڈ کرنے میں خرابی: ' + error.message);
        return;
      }

      setUsers((data || []) as UserType[]);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    return (
      (u.serial_number &&
        u.serial_number.toLowerCase().includes(search)) ||
      (u.full_name &&
        u.full_name.toLowerCase().includes(search)) ||
      (u.father_name &&
        u.father_name.toLowerCase().includes(search)) ||
      (u.pppoe_username &&
        u.pppoe_username.toLowerCase().includes(search)) ||
      (u.phone &&
        u.phone.toLowerCase().includes(search)) ||
      (u.whatsapp &&
        u.whatsapp.toLowerCase().includes(search)) ||
      (u.cnic &&
        u.cnic.toLowerCase().includes(search))
    );
  });

  /* =====================================================
     DELETE USER
  ===================================================== */

  const handleDelete = async (id: number, name: string) => {
    const confirmed = confirm(
      `کیا آپ واقعی ${name || 'اس یوزر'} کو ختم کرنا چاہتے ہیں؟`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        alert('خرابی: ' + error.message);
        return;
      }

      await fetchUsers();
    } catch (error: any) {
      alert('خرابی: ' + error.message);
    }
  };

  /* =====================================================
     SAVE EDIT
  ===================================================== */

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editUser) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: editUser.full_name?.trim() || '',
          father_name: editUser.father_name?.trim() || '',
          phone: editUser.phone?.trim() || '',
          whatsapp: editUser.whatsapp?.trim() || '',
          email: editUser.email?.trim() || null,

          // CNIC بھی اب اپڈیٹ ہوگا
          cnic: editUser.cnic?.trim() || '',

          address: editUser.address?.trim() || '',
          pppoe_username: editUser.pppoe_username?.trim() || '',
          pppoe_password: editUser.pppoe_password?.trim() || '',

          monthly_price:
            Number(editUser.monthly_price) || 0,

          connection_charges:
            Number(editUser.connection_charges) || 0,

          package_name: editUser.package_name?.trim() || '',
          speed: editUser.speed?.trim() || ''
        })
        .eq('id', editUser.id);

      if (error) {
        alert(
          'ترمیم محفوظ نہیں ہو سکی: ' +
            error.message
        );
        return;
      }

      alert('کسٹمر کی معلومات کامیابی سے اپڈیٹ ہو گئی ہیں۔');

      setEditUser(null);

      await fetchUsers();
    } catch (error: any) {
      alert(
        'ترمیم محفوظ کرنے میں خرابی: ' +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     INPUT STYLE
  ===================================================== */

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#ffffff',
    padding: '8px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    color: '#94a3b8',
    marginBottom: '4px',
    fontWeight: '600'
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%'
        }}
      >

        {/* ================= HEADER ================= */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background:
              'linear-gradient(135deg,#0f1f38,#1c2541)',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1px solid #3b82f6'
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
                  'rgba(16,185,129,.15)',
                padding: '9px',
                borderRadius: '10px',
                color: '#34d399'
              }}
            >
              <Users size={21} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#f8fafc'
                }}
              >
                تمام صارفین کی فہرست
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '10px',
                  color: '#93c5fd'
                }}
              >
                User Management • One Click
              </p>
            </div>
          </div>

          <div
            style={{
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Total: {users.length}
          </div>
        </div>

        {/* ================= SEARCH ================= */}

        <div
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
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
              placeholder="نام، ID، CNIC، فون یا PPPoE یوزر نیم سرچ کریں..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                padding: '10px 38px 10px 12px',
                borderRadius: '9px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />

            <Search
              size={15}
              style={{
                position: 'absolute',
                right: '12px',
                top: '11px',
                color: '#64748b'
              }}
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={fetching}
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
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
                fetching ? 'animate-spin' : ''
              }
            />
            ریفریش
          </button>
        </div>

        {/* ================= TABLE ================= */}

        <div
          style={{
            backgroundColor: '#1c2541',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #334155',
            overflowX: 'auto'
          }}
        >
          {fetching ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#38bdf8',
                fontSize: '12px'
              }}
            >
              <Loader2
                size={20}
                className="animate-spin"
              />
              <div style={{ marginTop: '8px' }}>
                ڈیٹا لوڈ ہو رہا ہے...
              </div>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'right',
                fontSize: '12px',
                minWidth: '850px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#0f172a',
                    borderBottom:
                      '1px solid #334155',
                    color: '#94a3b8'
                  }}
                >
                  <th style={{ padding: '9px' }}>
                    #
                  </th>

                  <th style={{ padding: '9px' }}>
                    کسٹمر ID
                  </th>

                  <th style={{ padding: '9px' }}>
                    نام
                  </th>

                  <th style={{ padding: '9px' }}>
                    ولدیت
                  </th>

                  <th style={{ padding: '9px' }}>
                    PPPoE
                  </th>

                  <th style={{ padding: '9px' }}>
                    فون
                  </th>

                  <th style={{ padding: '9px' }}>
                    پیکیج
                  </th>

                  <th
                    style={{
                      padding: '9px',
                      textAlign: 'center'
                    }}
                  >
                    ایکشن
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: '25px',
                        color: '#64748b'
                      }}
                    >
                      کوئی ریکارڈ نہیں ملا۔
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(
                    (user, index) => (
                      <tr
                        key={user.id}
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
                            color: '#22d3ee',
                            fontWeight: 'bold',
                            direction: 'ltr'
                          }}
                        >
                          {user.serial_number ||
                            '---'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                          }}
                        >
                          {user.full_name || '---'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            color: '#cbd5e1'
                          }}
                        >
                          {user.father_name ||
                            '---'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            color: '#38bdf8',
                            direction: 'ltr',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.pppoe_username ||
                            '---'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            color: '#34d399',
                            direction: 'ltr'
                          }}
                        >
                          {user.phone || '---'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            color: '#f472b6'
                          }}
                        >
                          {user.package_name ||
                            'Standard'}
                          {' • '}
                          {user.speed || 'N/A'}
                        </td>

                        <td
                          style={{
                            padding: '9px',
                            textAlign: 'center'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'center',
                              gap: '6px'
                            }}
                          >
                            {/* VIEW */}

                            <button
                              onClick={() =>
                                setViewUser(user)
                              }
                              style={{
                                backgroundColor:
                                  'rgba(59,130,246,.15)',
                                color: '#60a5fa',
                                border:
                                  '1px solid rgba(59,130,246,.35)',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px'
                              }}
                            >
                              <Eye size={12} />
                              دیکھیں
                            </button>

                            {/* EDIT */}

                            <button
                              onClick={() =>
                                setEditUser({
                                  ...user
                                })
                              }
                              style={{
                                backgroundColor:
                                  'rgba(245,158,11,.15)',
                                color: '#fbbf24',
                                border:
                                  '1px solid rgba(245,158,11,.35)',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px'
                              }}
                            >
                              <Edit size={12} />
                              ترمیم
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={() =>
                                handleDelete(
                                  user.id,
                                  user.full_name
                                )
                              }
                              style={{
                                backgroundColor:
                                  'rgba(239,68,68,.15)',
                                color: '#f87171',
                                border:
                                  '1px solid rgba(239,68,68,.35)',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* =================================================
            VIEW USER MODAL
        ================================================= */}

        {viewUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor:
                'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#1c2541',
                border: '1px solid #3b82f6',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '540px',
                padding: '20px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom:
                    '1px solid #334155',
                  paddingBottom: '10px'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: '#f472b6',
                    fontSize: '15px'
                  }}
                >
                  👤 کسٹمر کی مکمل تفصیلات
                </h3>

                <button
                  onClick={() =>
                    setViewUser(null)
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={19} />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(200px,1fr))',
                  gap: '12px',
                  fontSize: '12px'
                }}
              >
                <Detail
                  label="کسٹمر ID"
                  value={
                    viewUser.serial_number
                  }
                  color="#38bdf8"
                />

                <Detail
                  label="نام"
                  value={viewUser.full_name}
                />

                <Detail
                  label="ولدیت"
                  value={viewUser.father_name}
                />

                <Detail
                  label="فون نمبر"
                  value={viewUser.phone}
                  color="#34d399"
                />

                <Detail
                  label="واٹس ایپ"
                  value={viewUser.whatsapp}
                  color="#34d399"
                />

                <Detail
                  label="ای میل"
                  value={viewUser.email}
                />

                {/* CNIC VIEW */}

                <Detail
                  label="شناختی کارڈ / CNIC"
                  value={viewUser.cnic}
                  color="#fbbf24"
                />

                <Detail
                  label="پیکیج"
                  value={
                    viewUser.package_name
                  }
                  color="#f472b6"
                />

                <Detail
                  label="سپیڈ"
                  value={viewUser.speed}
                  color="#22d3ee"
                />

                <Detail
                  label="کنکشن چارجز"
                  value={`Rs ${Number(
                    viewUser.connection_charges ||
                      0
                  ).toLocaleString()}`}
                  color="#fbbf24"
                />

                <Detail
                  label="ماہانہ بل"
                  value={`Rs ${Number(
                    viewUser.monthly_price || 0
                  ).toLocaleString()}`}
                  color="#34d399"
                />
              </div>

              <div
                style={{
                  marginTop: '12px',
                  fontSize: '12px'
                }}
              >
                <span
                  style={{
                    color: '#94a3b8'
                  }}
                >
                  مکمل ایڈریس:
                </span>{' '}
                <span
                  style={{
                    color: '#ffffff'
                  }}
                >
                  {viewUser.address || '---'}
                </span>
              </div>

              {/* PPPoE */}

              <div
                style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: '1px solid #06b6d4'
                }}
              >
                <p
                  style={{
                    margin: '0 0 8px',
                    color: '#06b6d4',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                >
                  🔒 PPPoE اکاؤنٹ
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: '11px'
                  }}
                >
                  <span
                    style={{
                      color: '#94a3b8'
                    }}
                  >
                    Username
                  </span>

                  <strong
                    style={{
                      color: '#38bdf8',
                      direction: 'ltr'
                    }}
                  >
                    {viewUser.pppoe_username ||
                      '---'}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: '11px',
                    marginTop: '6px'
                  }}
                >
                  <span
                    style={{
                      color: '#94a3b8'
                    }}
                  >
                    Password
                  </span>

                  <strong
                    style={{
                      color: '#38bdf8',
                      direction: 'ltr'
                    }}
                  >
                    {viewUser.pppoe_password ||
                      '---'}
                  </strong>
                </div>
              </div>

              <button
                onClick={() =>
                  setViewUser(null)
                }
                style={{
                  width: '100%',
                  marginTop: '16px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '9px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                بند کریں
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            EDIT USER MODAL
        ================================================= */}

        {editUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor:
                'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#1c2541',
                border: '1px solid #fbbf24',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '650px',
                padding: '20px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom:
                    '1px solid #334155',
                  paddingBottom: '10px'
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: '#fbbf24',
                      fontSize: '15px'
                    }}
                  >
                    ✏️ کسٹمر ریکارڈ میں ترمیم
                  </h3>

                  <div
                    style={{
                      color: '#64748b',
                      fontSize: '10px',
                      marginTop: '3px'
                    }}
                  >
                    {editUser.serial_number}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditUser(null)
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={handleEditSave}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(210px,1fr))',
                  gap: '12px'
                }}
              >
                {/* NAME */}

                <EditField label="نام">
                  <input
                    type="text"
                    value={
                      editUser.full_name || ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        full_name:
                          e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </EditField>

                {/* FATHER */}

                <EditField label="ولدیت">
                  <input
                    type="text"
                    value={
                      editUser.father_name || ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        father_name:
                          e.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </EditField>

                {/* PHONE */}

                <EditField label="فون نمبر">
                  <input
                    type="text"
                    value={editUser.phone || ''}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        phone: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      direction: 'ltr'
                    }}
                  />
                </EditField>

                {/* WHATSAPP */}

                <EditField label="واٹس ایپ نمبر">
                  <input
                    type="text"
                    value={
                      editUser.whatsapp || ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        whatsapp:
                          e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      direction: 'ltr'
                    }}
                  />
                </EditField>

                {/* EMAIL */}

                <EditField label="ای میل">
                  <input
                    type="email"
                    value={editUser.email || ''}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        email: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      direction: 'ltr'
                    }}
                  />
                </EditField>

                {/* =========================================
                    NEW CNIC EDIT FIELD
                ========================================= */}

                <EditField label="شناختی کارڈ نمبر (CNIC)">
                  <div
                    style={{
                      position: 'relative'
                    }}
                  >
                    <input
                      type="text"
                      value={editUser.cnic || ''}
                      placeholder="35202-0000000-0"
                      maxLength={15}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          cnic: e.target.value
                        })
                      }
                      style={{
                        ...inputStyle,
                        border:
                          '1px solid #f59e0b',
                        color: '#fbbf24',
                        direction: 'ltr',
                        paddingRight: '35px'
                      }}
                    />

                    <CreditCard
                      size={14}
                      style={{
                        position: 'absolute',
                        right: '11px',
                        top: '9px',
                        color: '#f59e0b'
                      }}
                    />
                  </div>
                </EditField>

                {/* PACKAGE */}

                <EditField label="پیکیج نام">
                  <input
                    type="text"
                    value={
                      editUser.package_name ||
                      ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        package_name:
                          e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #3b82f6'
                    }}
                  />
                </EditField>

                {/* SPEED */}

                <EditField label="انٹرنیٹ سپیڈ">
                  <input
                    type="text"
                    value={editUser.speed || ''}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        speed: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #3b82f6'
                    }}
                  />
                </EditField>

                {/* CONNECTION CHARGES */}

                <EditField label="کنکشن چارجز (Rs)">
                  <input
                    type="number"
                    min="0"
                    value={
                      editUser.connection_charges ||
                      0
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        connection_charges:
                          Number(
                            e.target.value
                          ) || 0
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #ec4899',
                      color: '#f472b6',
                      fontWeight: 'bold'
                    }}
                  />
                </EditField>

                {/* MONTHLY */}

                <EditField label="ماہانہ بل (Rs)">
                  <input
                    type="number"
                    min="0"
                    value={
                      editUser.monthly_price ||
                      0
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        monthly_price:
                          Number(
                            e.target.value
                          ) || 0
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #10b981',
                      color: '#34d399',
                      fontWeight: 'bold'
                    }}
                  />
                </EditField>

                {/* PPPoE USER */}

                <EditField label="PPPoE یوزر نیم">
                  <input
                    type="text"
                    value={
                      editUser.pppoe_username ||
                      ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        pppoe_username:
                          e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #06b6d4',
                      color: '#38bdf8',
                      direction: 'ltr',
                      fontWeight: 'bold'
                    }}
                  />
                </EditField>

                {/* PPPoE PASSWORD */}

                <EditField label="PPPoE پاسورڈ">
                  <input
                    type="text"
                    value={
                      editUser.pppoe_password ||
                      ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        pppoe_password:
                          e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      border:
                        '1px solid #06b6d4',
                      color: '#38bdf8',
                      direction: 'ltr',
                      fontWeight: 'bold'
                    }}
                  />
                </EditField>

                {/* ADDRESS */}

                <div
                  style={{
                    gridColumn: '1 / -1'
                  }}
                >
                  <label style={labelStyle}>
                    مکمل ایڈریس
                  </label>

                  <textarea
                    rows={3}
                    value={
                      editUser.address || ''
                    }
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        address: e.target.value
                      })
                    }
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* BUTTONS */}

                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    gap: '8px',
                    justifyContent:
                      'flex-end',
                    marginTop: '10px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEditUser(null)
                    }
                    disabled={saving}
                    style={{
                      backgroundColor:
                        '#334155',
                      color: '#ffffff',
                      padding: '8px 15px',
                      borderRadius: '7px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    منسوخ کریں
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      background:
                        saving
                          ? '#92400e'
                          : 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                      color: '#111827',
                      padding: '8px 18px',
                      borderRadius: '7px',
                      border: 'none',
                      cursor: saving
                        ? 'not-allowed'
                        : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {saving ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={13} />
                    )}

                    {saving
                      ? 'محفوظ ہو رہا ہے...'
                      : 'ترمیم محفوظ کریں'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function Detail({
  label,
  value,
  color = '#ffffff'
}: {
  label: string;
  value: any;
  color?: string;
}) {
  return (
    <div>
      <span style={{ color: '#94a3b8' }}>
        {label}:
      </span>{' '}

      <strong style={{ color }}>
        {value || '---'}
      </strong>
    </div>
  );
}

function EditField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '10px',
          color: '#94a3b8',
          marginBottom: '4px',
          fontWeight: '600'
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}