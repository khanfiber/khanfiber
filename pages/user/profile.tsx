import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Shield,
  Key
} from 'lucide-react';

export default function UserProfilePage() {
  const [customer, setCustomer] = useState<any>(null);
  
  // ایڈٹ ہونے والی فیلڈز
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const customerId = parsedUser.id || parsedUser.customer_id;

      // Supabase سے کسٹمر کی لائیو پروفائل فیچ کریں
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      if (data) {
        setCustomer(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setCnic(data.cnic || '');
        setAddress(data.address || '');
      }
    } catch (err: any) {
      console.error('Profile Load Error:', err);
      setErrorMsg('پروفائل فیچ کرنے میں خرابی پیش آئی!');
    } finally {
      setLoading(false);
    }
  };

  // پروفائل اپ ڈیٹ کریں
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          cnic: cnic.trim(),
          address: address.trim()
        })
        .eq('id', customer.id);

      if (error) throw error;

      // لوکل سٹوریج اپ ڈیٹ کریں
      const updatedUser = {
        ...customer,
        full_name: fullName,
        phone,
        email,
        cnic,
        address
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCustomer(updatedUser);

      setSuccessMsg('آپ کی پروفائل معلومات کامیابی سے اپ ڈیٹ ہو گئی ہیں!');
    } catch (err: any) {
      setErrorMsg('پروفائل اپ ڈیٹ میں خرابی: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #fbbf24', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px', color: '#fbbf24' }}>
            <User size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#fbbf24', fontWeight: 'bold' }}>مائی پروفائل (My Profile)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنی ذاتی معلومات اور اکاؤنٹ تفصیلات دیکھیں اور اپ ڈیٹ کریں</p>
          </div>
        </div>

        {/* پیغامات */}
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#38bdf8', padding: '30px 0', fontSize: '13px' }}>پروفائل لوڈ ہو رہی ہے...</p>
        ) : (
          <form onSubmit={handleUpdateProfile} style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* ناقابلِ تبدیلی معلومات (System Info) */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} style={{ color: '#38bdf8' }} /> سیریل / کسٹمر نمبر
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', direction: 'ltr', textAlign: 'right' }}>
                  {customer?.serial_number || '---'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Key size={12} style={{ color: '#fbbf24' }} /> PPPoE یوزر نیم
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', direction: 'ltr', textAlign: 'right' }}>
                  {customer?.pppoe_username || '---'}
                </p>
              </div>
            </div>

            {/* 1. پورا نام */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
                پورا نام (Full Name) *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 10px 10px 36px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                />
                <User size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 2. موبائل نمبر اور ای میل */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
                  موبائل نمبر (Phone) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 10px 10px 36px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', direction: 'ltr' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
                  ای میل ایڈریس (Email)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 10px 10px 36px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', direction: 'ltr' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
                </div>
              </div>
            </div>

            {/* 3. شناختی کارڈ (CNIC) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
                شناختی کارڈ نمبر (CNIC)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="35202-0000000-0"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 10px 10px 36px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', direction: 'ltr' }}
                />
                <CreditCard size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 4. مکمل پتہ */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
                مکمل پتہ (Address)
              </label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 10px 10px 36px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
                />
                <MapPin size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* محفوظ کریں بٹن */}
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                backgroundColor: '#3b82f6', 
                color: '#fff', 
                padding: '11px', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: 'bold', 
                fontSize: '12px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                marginTop: '6px'
              }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'پروفائل محفوظ ہو رہی ہے...' : 'پروفائل تبدیلیاں محفوظ کریں'}
            </button>

          </form>
        )}

      </div>
    </Layout>
  );
}