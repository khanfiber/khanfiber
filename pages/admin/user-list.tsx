import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  ArrowRight, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  RefreshCw,
  Phone,
  MapPin,
  CreditCard,
  KeyRound,
  Calendar
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
  created_at: string;
}

export default function UserList() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(true);

  // Modals state
  const [viewUser, setViewUser] = useState<UserType | null>(null);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);

  // Supabase سے یوزرز لانا
  const fetchUsers = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: false });

    if (data) {
      setUsers(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // سرچ کی بنیاد پر فلٹر
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(search)) ||
      (u.father_name && u.father_name.toLowerCase().includes(search)) ||
      (u.pppoe_username && u.pppoe_username.toLowerCase().includes(search)) ||
      (u.phone && u.phone.includes(search))
    );
  });

  // یوزر ڈیلیٹ کرنا
  const handleDelete = async (id: number, name: string) => {
    if (confirm(`کیا آپ واقعی ${name || 'اس یوزر'} کو ختم کرنا چاہتے ہیں؟`)) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        alert('خرابی: ' + error.message);
      } else {
        fetchUsers();
      }
    }
  };

  // ترمیم محفوظ کرنا
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('customers')
      .update({
        full_name: editUser.full_name,
        father_name: editUser.father_name,
        phone: editUser.phone,
        whatsapp: editUser.whatsapp,
        email: editUser.email,
        cnic: editUser.cnic,
        address: editUser.address,
        pppoe_username: editUser.pppoe_username,
        pppoe_password: editUser.pppoe_password,
        monthly_price: editUser.monthly_price
      })
      .eq('id', editUser.id);

    if (error) {
      alert('ترمیم محفوظ نہیں ہو سکی: ' + error.message);
    } else {
      setEditUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* ٹاپ بار */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#1c2541', 
          padding: '14px 20px', 
          borderRadius: '16px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px', color: '#34d399' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                تمام صارفین کی فہرست (User List)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                صارفین کی معلومات دیکھیں، ترمیم کریں یا نیا ریکارڈ سرچ کریں
              </p>
            </div>
          </div>

          <Link href="/admin/dashboard" style={{ 
            backgroundColor: '#0f172a', 
            color: '#38bdf8', 
            padding: '8px 16px', 
            borderRadius: '10px', 
            fontSize: '12px', 
            textDecoration: 'none', 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            border: '1px solid #334155'
          }}>
            <ArrowRight size={16} />
            ڈیش بورڈ پر واپس جائیں
          </Link>
        </div>

        {/* سرچ بار اور ریفریش */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '16px', 
          padding: '16px', 
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input 
              type="text"
              placeholder="نام، ولدیت، یوزر نیم یا فون نمبر سے سرچ کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                fontSize: '13px'
              }}
            />
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '11px', color: '#64748b' }} />
          </div>

          <button 
            onClick={fetchUsers}
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
            ریفریش کریں
          </button>
        </div>

        {/* یوزرز کا مین ٹیبل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '20px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#38bdf8' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>نام</th>
                  <th style={{ padding: '12px' }}>ولدیت</th>
                  <th style={{ padding: '12px' }}>PPPoE یوزر نیم</th>
                  <th style={{ padding: '12px' }}>فون نمبر</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ایکشن (Action)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      کوئی ریکارڈ نہیں ملا۔
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                        {user.full_name || '---'}
                      </td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>
                        {user.father_name || '---'}
                      </td>
                      <td style={{ padding: '12px', color: '#38bdf8', direction: 'ltr', textAlign: 'right', fontWeight: 'bold' }}>
                        {user.pppoe_username || '---'}
                      </td>
                      <td style={{ padding: '12px', color: '#34d399' }}>
                        {user.phone || '---'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyCenter: 'center', justifyContent: 'center', gap: '8px' }}>
                          
                          {/* 1. ویوو (View) */}
                          <button 
                            onClick={() => setViewUser(user)}
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            title="معلومات دیکھیں"
                          >
                            <Eye size={14} /> دیکھئے
                          </button>

                          {/* 2. ایڈیٹ (Edit) */}
                          <button 
                            onClick={() => setEditUser(user)}
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            title="ترمیم کریں"
                          >
                            <Edit size={14} /> ترمیم
                          </button>

                          {/* 3. ڈیلیٹ (Delete) */}
                          <button 
                            onClick={() => handleDelete(user.id, user.full_name)}
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 size={14} /> ڈیلیٹ
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= VIEW USER MODAL ================= */}
        {viewUser && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #334155', pb: '12px' }}>
                <h3 style={{ margin: 0, color: '#f472b6', fontSize: '18px', fontWeight: 'bold' }}>👤 کسٹمر کی مکمل تفصیلات</h3>
                <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>سیریل نمبر:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{viewUser.serial_number || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>نام:</span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{viewUser.full_name || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>ولدیت:</span>
                  <span style={{ color: '#ffffff' }}>{viewUser.father_name || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>فون نمبر:</span>
                  <span style={{ color: '#34d399' }}>{viewUser.phone || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>واٹس ایپ:</span>
                  <span style={{ color: '#34d399' }}>{viewUser.whatsapp || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>شناختی کارڈ:</span>
                  <span style={{ color: '#cbd5e1' }}>{viewUser.cnic || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>ایڈریس:</span>
                  <span style={{ color: '#cbd5e1', textAlign: 'left' }}>{viewUser.address || '---'}</span>
                </div>

                <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
                  <p style={{ margin: '0 0 6px 0', color: '#38bdf8', fontWeight: 'bold' }}>🔒 PPPoE اکاؤنٹ سیٹنگز:</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>یوزر نیم:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold', direction: 'ltr' }}>{viewUser.pppoe_username || '---'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>پاسورڈ:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold', direction: 'ltr' }}>{viewUser.pppoe_password || '---'}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setViewUser(null)} 
                style={{ width: '100%', marginTop: '20px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                بند کریں
              </button>
            </div>
          </div>
        )}

        {/* ================= EDIT USER MODAL ================= */}
        {editUser && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #fbbf24', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #334155', pb: '12px' }}>
                <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '18px', fontWeight: 'bold' }}>✏️ کسٹمر ریکارڑ میں ترمیم کریں</h3>
                <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>نام</label>
                  <input 
                    type="text" 
                    value={editUser.full_name || ''} 
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>ولدیت</label>
                  <input 
                    type="text" 
                    value={editUser.father_name || ''} 
                    onChange={(e) => setEditUser({ ...editUser, father_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>فون نمبر</label>
                  <input 
                    type="text" 
                    value={editUser.phone || ''} 
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>PPPoE یوزر نیم</label>
                  <input 
                    type="text" 
                    value={editUser.pppoe_username || ''} 
                    onChange={(e) => setEditUser({ ...editUser, pppoe_username: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #06b6d4', color: '#38bdf8', padding: '8px', borderRadius: '8px', fontSize: '12px', direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>ایڈریس</label>
                  <input 
                    type="text" 
                    value={editUser.address || ''} 
                    onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditUser(null)}
                    style={{ backgroundColor: '#334155', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    منسوخ کریں
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{ backgroundColor: '#fbbf24', color: '#000', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    ترمیم محفوظ کریں
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