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
  Wifi,
  Gauge,
  DollarSign
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
    if (error) console.error('Fetch error:', error);
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

  // تمام فیلڈز کی ترمیم محفوظ کرنا
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
        monthly_price: editUser.monthly_price ? parseFloat(String(editUser.monthly_price)) : 0,
        connection_charges: editUser.connection_charges ? parseFloat(String(editUser.connection_charges)) : 0,
        package_name: editUser.package_name,
        speed: editUser.speed
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        
        {/* ٹاپ بار */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#1c2541', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34d399' }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                تمام صارفین کی فہرست (User List)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                صارفین کی مکمل تفصیلات دیکھیں، ترمیم کریں یا سرچ کریں
              </p>
            </div>
          </div>
        </div>

        {/* سرچ بار اور ریفریش */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '12px', 
          padding: '12px', 
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
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
                padding: '8px 10px 8px 34px',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '10px', color: '#64748b' }} />
          </div>

          <button 
            onClick={fetchUsers}
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            ریفریش کریں
          </button>
        </div>

        {/* یوزرز کا مین ٹیبل */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '14px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>نام</th>
                  <th style={{ padding: '8px' }}>ولدیت</th>
                  <th style={{ padding: '8px' }}>PPPoE یوزر نیم</th>
                  <th style={{ padding: '8px' }}>فون نمبر</th>
                  <th style={{ padding: '8px' }}>پیکیج</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>ایکشن (Action)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      کوئی ریکارڈ نہیں ملا۔
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                        {user.full_name || '---'}
                      </td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>
                        {user.father_name || '---'}
                      </td>
                      <td style={{ padding: '8px', color: '#38bdf8', direction: 'ltr', textAlign: 'right', fontWeight: 'bold' }}>
                        {user.pppoe_username || '---'}
                      </td>
                      <td style={{ padding: '8px', color: '#34d399' }}>
                        {user.phone || '---'}
                      </td>
                      <td style={{ padding: '8px', color: '#f472b6' }}>
                        {user.package_name || 'Standard'} ({user.speed || 'N/A'})
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          
                          {/* 1. ویوو (View) */}
                          <button 
                            onClick={() => setViewUser(user)}
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                            title="مکمل معلومات دیکھیں"
                          >
                            <Eye size={12} /> دیکھئے
                          </button>

                          {/* 2. ایڈیٹ (Edit) */}
                          <button 
                            onClick={() => setEditUser(user)}
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                            title="ترمیم کریں"
                          >
                            <Edit size={12} /> ترمیم
                          </button>

                          {/* 3. ڈیلیٹ (Delete) */}
                          <button 
                            onClick={() => handleDelete(user.id, user.full_name)}
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 size={12} /> ڈیلیٹ
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

        {/* ================= VIEW USER MODAL (مکمل ڈیٹیلز) ================= */}
        {viewUser && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#f472b6', fontSize: '15px', fontWeight: 'bold' }}>👤 کسٹمر کی مکمل تفصیلات</h3>
                <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: '#94a3b8' }}>سیریل نمبر:</span> <strong style={{ color: '#38bdf8' }}>{viewUser.serial_number || '---'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>نام:</span> <strong style={{ color: '#ffffff' }}>{viewUser.full_name || '---'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ولدیت:</span> <span style={{ color: '#ffffff' }}>{viewUser.father_name || '---'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>فون نمبر:</span> <span style={{ color: '#34d399' }}>{viewUser.phone || '---'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>واٹس ایپ:</span> <span style={{ color: '#34d399' }}>{viewUser.whatsapp || '---'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>ای میل:</span> <span style={{ color: '#cbd5e1' }}>{viewUser.email || '---'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>شناختی کارڈ:</span> <span style={{ color: '#cbd5e1' }}>{viewUser.cnic || '---'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>پیکیج نام:</span> <strong style={{ color: '#f472b6' }}>{viewUser.package_name || 'Standard'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>سپیڈ:</span> <strong style={{ color: '#f472b6' }}>{viewUser.speed || 'N/A'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>کنکشن چارجز:</span> <strong style={{ color: '#fbbf24' }}>Rs {viewUser.connection_charges || 0}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ماہانہ چارجز:</span> <strong style={{ color: '#34d399' }}>Rs {viewUser.monthly_price || 0}</strong></div>
                <div style={{ gridColumn: 'span 1 / -1' }}><span style={{ color: '#94a3b8' }}>مکمل ایڈریس:</span> <span style={{ color: '#cbd5e1' }}>{viewUser.address || '---'}</span></div>
              </div>

              {/* PPPoE بلاک */}
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #06b6d4' }}>
                <p style={{ margin: '0 0 6px 0', color: '#06b6d4', fontWeight: 'bold', fontSize: '11px' }}>🔒 PPPoE اکاؤنٹ کریڈینشلز:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>یوزر نیم:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', direction: 'ltr' }}>{viewUser.pppoe_username || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>پاسورڈ:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', direction: 'ltr' }}>{viewUser.pppoe_password || '---'}</span>
                </div>
              </div>

              <button 
                onClick={() => setViewUser(null)} 
                style={{ width: '100%', marginTop: '16px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                بند کریں
              </button>
            </div>
          </div>
        )}

        {/* ================= EDIT USER MODAL (مکمل ایڈیٹنگ) ================= */}
        {editUser && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #fbbf24', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '15px', fontWeight: 'bold' }}>✏️ کسٹمر ریکارڑ میں مکمل ترمیم کریں</h3>
                <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>نام</label>
                  <input 
                    type="text" 
                    value={editUser.full_name || ''} 
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>ولدیت</label>
                  <input 
                    type="text" 
                    value={editUser.father_name || ''} 
                    onChange={(e) => setEditUser({ ...editUser, father_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>فون نمبر</label>
                  <input 
                    type="text" 
                    value={editUser.phone || ''} 
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>واٹس ایپ نمبر</label>
                  <input 
                    type="text" 
                    value={editUser.whatsapp || ''} 
                    onChange={(e) => setEditUser({ ...editUser, whatsapp: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>پیکیج نام</label>
                  <input 
                    type="text" 
                    value={editUser.package_name || ''} 
                    onChange={(e) => setEditUser({ ...editUser, package_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>انٹرنیٹ سپیڈ</label>
                  <input 
                    type="text" 
                    value={editUser.speed || ''} 
                    onChange={(e) => setEditUser({ ...editUser, speed: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>کنکشن چارجز (Rs)</label>
                  <input 
                    type="number" 
                    value={editUser.connection_charges || 0} 
                    onChange={(e) => setEditUser({ ...editUser, connection_charges: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ec4899', color: '#f472b6', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>ماہانہ بل (Rs)</label>
                  <input 
                    type="number" 
                    value={editUser.monthly_price || 0} 
                    onChange={(e) => setEditUser({ ...editUser, monthly_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>PPPoE یوزر نیم</label>
                  <input 
                    type="text" 
                    value={editUser.pppoe_username || ''} 
                    onChange={(e) => setEditUser({ ...editUser, pppoe_username: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #06b6d4', color: '#38bdf8', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', direction: 'ltr', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>PPPoE پاسورڈ</label>
                  <input 
                    type="text" 
                    value={editUser.pppoe_password || ''} 
                    onChange={(e) => setEditUser({ ...editUser, pppoe_password: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #06b6d4', color: '#38bdf8', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', direction: 'ltr', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>ایڈریس</label>
                  <input 
                    type="text" 
                    value={editUser.address || ''} 
                    onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditUser(null)}
                    style={{ backgroundColor: '#334155', color: '#fff', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                  >
                    منسوخ کریں
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{ backgroundColor: '#fbbf24', color: '#000', padding: '6px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
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