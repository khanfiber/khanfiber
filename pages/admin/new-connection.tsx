import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';
import { 
  UserPlus, 
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
  Loader2,
  Wifi,
  Gauge,
  DollarSign,
  Package as PackageIcon
} from 'lucide-react';

interface PackageType {
  id: number;
  package_name: string;
  speed: string;
  price: number;
}

export default function NewConnection() {
  const [formData, setFormData] = useState({
    serialNumber: 'KFN-0001',
    fullName: '',
    fatherName: '',
    phone: '',
    whatsapp: '',
    email: '',
    cnic: '',
    address: '',
    pppoeUsername: '',
    pppoePassword: '',
    monthlyPrice: '',
    connectionCharges: '',
    packageName: '',
    speed: ''
  });

  const [packagesList, setPackagesList] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. خودکار سیریل نمبر اور Supabase سے پیکجز کی لسٹ فیچ کرنا
  useEffect(() => {
    const initData = async () => {
      try {
        // سیریل نمبر جنریٹ کریں
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        const nextNum = (count || 0) + 1;
        const formattedSerial = `KFN-${String(nextNum).padStart(4, '0')}`;
        setFormData(prev => ({ ...prev, serialNumber: formattedSerial }));

        // ایڈمن کے تمام پیکجز فیچ کریں
        const { data: pkgData } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });

        if (pkgData) {
          setPackagesList(pkgData);
        }
      } catch (err) {
        console.error('Initialization Error:', err);
      }
    };

    initData();
  }, [isSubmitted]);

  // 2. پیکج سلیکٹ کرنے پر سپیڈ اور ماہانہ بل آٹو سیٹ کریں
  const handlePackageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPkgName = e.target.value;
    const pkgObj = packagesList.find(p => p.package_name === selectedPkgName);

    if (pkgObj) {
      setFormData(prev => ({
        ...prev,
        packageName: pkgObj.package_name,
        speed: pkgObj.speed,
        monthlyPrice: String(pkgObj.price)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        packageName: selectedPkgName,
        speed: '',
        monthlyPrice: ''
      }));
    }
  };

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
      // 1. Supabase میں کسٹمر سیو کریں (ڈیفالٹ پورٹل پاسورڈ 12345 خودکار سیٹ ہو گا)
      const { error } = await supabase
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
            monthly_price: formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : 0,
            connection_charges: formData.connectionCharges ? parseFloat(formData.connectionCharges) : 0,
            package_name: formData.packageName,
            speed: formData.speed,
            password: '12345' // کسٹمر پورٹل لاگ ان پاسورڈ
          }
        ]);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSubmitted(true);

        // 2. واٹس ایپ پر ڈائریکٹ پورٹل لنک اور لاگ ان تفصیلات کے ساتھ میسج بھیجیں
        const targetPhone = formData.whatsapp || formData.phone;
        if (targetPhone) {
          const welcomeMessage = 
            `🎉 *خان فائبر انٹرنیٹ نیٹ ورک - نیا کنکشن مبارک!* 🎉\n\n` +
            `محترم *${formData.fullName || 'صارف'}*!\n` +
            `خان فائبر نیٹ ورک کی فیملی میں خوش آمدید۔ آپ کا نیا انٹرنیٹ کنکشن کامیابی سے ایکٹیویٹ کر دیا گیا ہے۔\n\n` +
            `📋 *کنکشن کی تفصیلات:*\n` +
            `🆔 *سیریل نمبر:* ${formData.serialNumber}\n` +
            `📦 *پیکیج نام:* ${formData.packageName || 'Standard'}\n` +
            `⚡ *سپیڈ:* ${formData.speed || 'N/A'}\n` +
            `💳 *کنکشن چارجز:* Rs ${formData.connectionCharges || '0'}\n` +
            `💰 *ماہانہ چارجز:* Rs ${formData.monthlyPrice || '0'}\n\n` +
            `🔑 *روٹر / PPPoE کنکشن لاگ ان:*\n` +
            `👤 *یوزر نیم:* ${formData.pppoeUsername}\n` +
            `🔒 *پاسورڈ:* ${formData.pppoePassword}\n\n` +
            `🌐 *کسٹمر پورٹل و موبائل ایپ:* \n` +
            `اپنے موبائل میں خان فائبر کی ایپ انسٹال کرنے یا آن لائن بل جمع کروانے کے لیے نیچے دیے گئے لنک پر کلک کریں:\n` +
            `👉 https://khanfiber.vercel.app\n\n` +
            `📱 *پورٹل لاگ ان تفصیلات:*\n` +
            `👤 *یوزر نیم / کسٹمر ID:* ${formData.serialNumber}\n` +
            `🔒 *پاسورڈ:* 12345\n` +
            `*(آپ پورٹل میں لاگ ان کر کے اپنا پاسورڈ بھی تبدیل کر سکتے ہیں)*\n\n` +
            `کسی بھی مسئلہ یا معلومات کی صورت میں رابطہ کریں۔\n` +
            `شکریہ! *خان فائبر نیٹ ورک ٹیم*`;

          openWhatsAppDirect(targetPhone, welcomeMessage);
        }

        // فارم ری سیٹ کریں
        setFormData({
          serialNumber: 'KFN-0001',
          fullName: '',
          fatherName: '',
          phone: '',
          whatsapp: '',
          email: '',
          cnic: '',
          address: '',
          pppoeUsername: '',
          pppoePassword: '',
          monthlyPrice: '',
          connectionCharges: '',
          packageName: '',
          speed: ''
        });
      }
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message || 'غیر متوقع خرابی پیش آئی'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(prev => ({
      ...prev,
      fullName: '',
      fatherName: '',
      phone: '',
      whatsapp: '',
      email: '',
      cnic: '',
      address: '',
      pppoeUsername: '',
      pppoePassword: '',
      monthlyPrice: '',
      connectionCharges: '',
      packageName: '',
      speed: ''
    }));
    setErrorMessage('');
    setIsSubmitted(false);
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        
        {/* ٹاپ ہیڈر */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#1c2541', 
          padding: '10px 14px', 
          borderRadius: '12px', 
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '6px', borderRadius: '8px', color: '#22d3ee' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#f472b6' }}>
                نیا انٹرنیٹ کنکشن فارم (New Connection)
              </h2>
              <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd' }}>
                صارف کا نیا اندراج اور ڈائریکٹ واٹس ایپ نوٹیفکیشن
              </p>
            </div>
          </div>
        </div>

        {/* الرٹس */}
        {isSubmitted && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            نیا کنکشن محفوظ ہو گیا اور واٹس ایپ ونڈو کھول دی گئی ہے!
          </div>
        )}

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* مین فارم */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#1c2541', borderRadius: '14px', padding: '16px', border: '1px solid #334155' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            
            {/* 1. سیریل نمبر */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#f472b6', marginBottom: '4px' }}>
                سیریل نمبر (Serial Number)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="serialNumber" 
                  value={formData.serialNumber} 
                  onChange={handleChange}
                  readOnly
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Hash size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 2. نام */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                صارف کا نام (Full Name) *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="fullName" 
                  required
                  placeholder="صارف کا مکمل نام"
                  value={formData.fullName} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <User size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 3. ولدیت */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                ولدیت (Father Name)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="fatherName" 
                  placeholder="والد کا نام"
                  value={formData.fatherName} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <User size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 4. فون نمبر */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                فون نمبر (Mobile Number) *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="phone" 
                  required
                  placeholder="03001234567"
                  value={formData.phone} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Phone size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 5. واٹس ایپ نمبر */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                واٹس ایپ نمبر (WhatsApp)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="whatsapp" 
                  placeholder="03001234567"
                  value={formData.whatsapp} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <MessageSquare size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 6. پیکیج سلیکٹ کریں (Auto-Fill Dropdown) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
                پیکیج منتخب کریں (Package)
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={formData.packageName}
                  onChange={handlePackageSelect}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #38bdf8', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
                >
                  <option value="">پیکیج منتخب کریں...</option>
                  {packagesList.map(pkg => (
                    <option key={pkg.id} value={pkg.package_name}>
                      {pkg.package_name} ({pkg.speed}) - Rs {pkg.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7. سپیڈ (خودکار) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
                انٹرنیٹ سپیڈ (Speed)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="speed" 
                  placeholder="مثلاً: 10 Mbps"
                  value={formData.speed} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #38bdf8', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Gauge size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#38bdf8' }} />
              </div>
            </div>

            {/* 8. کنکشن چارجز */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#f472b6', marginBottom: '4px' }}>
                کنکشن چارجز (Connection Charges Rs)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="connectionCharges" 
                  placeholder="2000"
                  value={formData.connectionCharges} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #ec4899', color: '#f472b6', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#ec4899' }} />
              </div>
            </div>

            {/* 9. ماہانہ چارجز (خودکار) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>
                ماہانہ چارجز (Monthly Charges Rs) *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="monthlyPrice" 
                  required
                  placeholder="1500"
                  value={formData.monthlyPrice} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
              </div>
            </div>

            {/* 10. ای میل */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                ای میل ایڈریس (Email)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="user@gmail.com"
                  value={formData.email} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 11. شناختی کارڈ */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                شناختی کارڈ (CNIC)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="cnic" 
                  placeholder="35202-0000000-0"
                  value={formData.cnic} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }} 
                />
                <CreditCard size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 12. ایڈریس */}
            <div style={{ gridColumn: 'span 1 / -1' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                مکمل ایڈریس (Address)
              </label>
              <div style={{ position: 'relative' }}>
                <textarea 
                  name="address" 
                  rows={2}
                  placeholder="پتہ درج کریں..."
                  value={formData.address} 
                  onChange={handleChange}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit' }} 
                />
                <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

          </div>

          {/* PPPoE کریڈینشلز */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #334155' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '10px' }}>
              🔒 PPPoE اکاؤنٹ کریڈینشلز
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              
              {/* PPPoE یوزر نیم */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                  PPPoE یوزر نیم *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="pppoeUsername" 
                    required
                    placeholder="ali123"
                    value={formData.pppoeUsername} 
                    onChange={handleChange}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #06b6d4', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', direction: 'ltr' }} 
                  />
                  <KeyRound size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#06b6d4' }} />
                </div>
              </div>

              {/* PPPoE پاسورڈ */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                  PPPoE پاسورڈ *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    name="pppoePassword" 
                    required
                    placeholder="پاسورڈ درج کریں"
                    value={formData.pppoePassword} 
                    onChange={handleChange}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #06b6d4', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', direction: 'ltr' }} 
                  />
                  <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#06b6d4' }} />
                </div>
              </div>

            </div>
          </div>

          {/* ایکشن بٹنز */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={handleReset}
              disabled={loading}
              style={{ backgroundColor: '#334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              ری سیٹ
            </button>

            <button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: '#3b82f6', color: '#ffffff', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  محفوظ ہو رہا ہے...
                </>
              ) : (
                <>
                  <Save size={14} />
                  محفوظ کریں اور واٹس ایپ بھیجیں
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </Layout>
  );
}
