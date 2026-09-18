import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { 
  UserPlus, 
  ArrowRight, 
  Save, 
  RotateCcw, 
  User, 
  Phone, 
  MessageSquare, 
  Mail, 
  CreditCard, 
  MapPin, 
  KeyRound, 
  Lock, 
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function NewConnection() {
  const [formData, setFormData] = useState({
    serialNumber: `KFN-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: '',
    fatherName: '',
    phone: '',
    whatsapp: '',
    email: '',
    cnic: '',
    address: '',
    pppoeUsername: '',
    pppoePassword: '',
    monthlyPrice: ''
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setIsSubmitted(false);

    try {
      // Supabase میں کسٹمر ریکارڑ محفوظ کرنا
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            serial_number: formData.serialNumber,
            full_name: formData.fullName,
            father_name: formData.fatherName,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            email: formData.email,
            cnic: formData.cnic,
            address: formData.address,
            pppoe_username: formData.pppoeUsername,
            pppoe_password: formData.pppoePassword,
            monthly_price: formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : 0
          }
        ]);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSubmitted(true);
        // فارم ری سیٹ کریں اور نیا سیریل نمبر جنریٹ کریں
        setFormData({
          serialNumber: `KFN-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: '',
          fatherName: '',
          phone: '',
          whatsapp: '',
          email: '',
          cnic: '',
          address: '',
          pppoeUsername: '',
          pppoePassword: '',
          monthlyPrice: ''
        });
      }
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message || 'غیر متوقع خرابی پیش آئی'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      serialNumber: `KFN-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      fatherName: '',
      phone: '',
      whatsapp: '',
      email: '',
      cnic: '',
      address: '',
      pppoeUsername: '',
      pppoePassword: '',
      monthlyPrice: ''
    });
    setErrorMessage('');
    setIsSubmitted(false);
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* ٹاپ بار: نیویگیشن اور ٹائٹل */}
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
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '12px', color: '#22d3ee' }}>
              <UserPlus size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f472b6' }}>
                نیا انٹرنیٹ کنکشن فارم (New Connection)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#93c5fd' }}>
                نیا صارف درج کریں اور مائیکروٹک و Supabase میں اکاؤنٹ محفوظ کریں
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

        {/* کامیابی کا پیغام */}
        {isSubmitted && (
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.2)', 
            border: '1px solid #10b981', 
            color: '#34d399', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <CheckCircle2 size={20} />
            نیا کنکشن کامیابی کے ساتھ Supabase میں محفوظ ہو گیا ہے!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid #ef4444', 
            color: '#f87171', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <AlertCircle size={20} />
            {errorMessage}
          </div>
        )}

        {/* اصلی رجسٹریشن فارم (تمام فیلڈز اپشنل) */}
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '20px', 
          padding: '24px', 
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            
            {/* 1. سیریل نمبر (Serial Number) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#f472b6', marginBottom: '6px' }}>
                سیریل نمبر (Serial Number)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="serialNumber" 
                  value={formData.serialNumber} 
                  onChange={handleChange}
                  placeholder="KFN-1001"
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #3b82f6', 
                    color: '#38bdf8', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }} 
                />
                <Hash size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 2. نام (Full Name) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                صارف کا نام (Full Name)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="صارف کا مکمل نام درج کریں"
                  value={formData.fullName} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 3. ولدیت (Father Name) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                ولدیت (Father Name)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="fatherName" 
                  placeholder="والد کا نام درج کریں"
                  value={formData.fatherName} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 4. فون نمبر (Phone Number) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                فون نمبر (Mobile Number)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="phone" 
                  placeholder="03001234567"
                  value={formData.phone} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 5. واٹس ایپ نمبر (WhatsApp Number) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                واٹس ایپ نمبر (WhatsApp Number)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="whatsapp" 
                  placeholder="03001234567"
                  value={formData.whatsapp} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <MessageSquare size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 6. ای میل (Email Address) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                ای میل ایڈریس (Email)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="user@gmail.com"
                  value={formData.email} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 7. شناختی کارڈ نمبر (CNIC Number) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                شناختی کارڈ نمبر (CNIC Number)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="cnic" 
                  placeholder="35202-0000000-0"
                  value={formData.cnic} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
                <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            {/* 8. ماہانہ چارجز (Monthly Price) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                ماہانہ چارجز (Monthly Price - Rs)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="monthlyPrice" 
                  placeholder="1500"
                  value={formData.monthlyPrice} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px' 
                  }} 
                />
              </div>
            </div>

            {/* 9. ایڈریس (Home Address) */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                مکمل ایڈریس (Address)
              </label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  name="address" 
                  rows={2}
                  placeholder="گھر / دکان کا مکمل پتہ درج کریں..."
                  value={formData.address} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    color: '#ffffff', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }} 
                />
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

          </div>

          {/* سیکشن 2: PPPoE کریڈینشلز (MikroTik / Network Setup) */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #334155' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '14px' }}>
              🔒 مائیکروٹک PPPoE اکاؤنٹ سیٹنگز
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              
              {/* 10. پی پی پی او ای یوزر نیم (PPPoE Username) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                  PPPoE یوزر نیم (PPPoE Username)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="pppoeUsername" 
                    placeholder="ali123"
                    value={formData.pppoeUsername} 
                    onChange={handleChange}
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #06b6d4', 
                      color: '#38bdf8', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      fontSize: '13px',
                      fontWeight: 'bold',
                      direction: 'ltr'
                    }} 
                  />
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#06b6d4' }} />
                </div>
              </div>

              {/* 11. پاسورڈ (PPPoE Password) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>
                  پاسورڈ (PPPoE Password)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="pppoePassword" 
                    placeholder="پاسورڈ درج کریں"
                    value={formData.pppoePassword} 
                    onChange={handleChange}
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #06b6d4', 
                      color: '#38bdf8', 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      fontSize: '13px',
                      fontWeight: 'bold',
                      direction: 'ltr'
                    }} 
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#06b6d4' }} />
                </div>
              </div>

            </div>
          </div>

          {/* ایکشن بٹنز (Action Buttons) */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button 
              type="button" 
              onClick={handleReset}
              disabled={loading}
              style={{ 
                backgroundColor: '#334155', 
                color: '#cbd5e1', 
                padding: '10px 20px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} />
              ری سیٹ کریں
            </button>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                backgroundColor: '#3b82f6', 
                color: '#ffffff', 
                padding: '10px 24px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  محفوظ ہو رہا ہے...
                </>
              ) : (
                <>
                  <Save size={16} />
                  نیا کنکشن محفوظ کریں
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </Layout>
  );
}