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
  Gauge,
  DollarSign,
  Package
} from 'lucide-react';

interface PackageType {
  id: number;
  package_name: string;
  speed: string;
  price: number;
}

export default function NewConnection() {

  const [formData, setFormData] = useState({
    serialNumber: 'HFN0001',
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
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // =====================================================
  // INITIAL DATA
  // Serial Number + Packages
  // =====================================================

  useEffect(() => {

    const initData = async () => {

      setInitializing(true);

      try {

        // -----------------------------------------------
        // Last HFN serial number حاصل کریں
        // -----------------------------------------------

        const { data: customerData, error: customerError } =
          await supabase
            .from('customers')
            .select('serial_number')
            .like('serial_number', 'HFN%');

        if (customerError) {
          console.error(
            'Serial Fetch Error:',
            customerError
          );
        }

        let highestNumber = 0;

        if (customerData && customerData.length > 0) {

          customerData.forEach((customer) => {

            const serial =
              String(customer.serial_number || '');

            const match =
              serial.match(/^HFN(\d+)$/i);

            if (match) {

              const number =
                parseInt(match[1], 10);

              if (
                !Number.isNaN(number) &&
                number > highestNumber
              ) {
                highestNumber = number;
              }

            }

          });

        }

        const nextNumber = highestNumber + 1;

        const formattedSerial =
          `HFN${String(nextNumber).padStart(4, '0')}`;

        setFormData(prev => ({
          ...prev,
          serialNumber: formattedSerial
        }));


        // -----------------------------------------------
        // Packages from Supabase
        // -----------------------------------------------

        const {
          data: pkgData,
          error: packageError
        } = await supabase
          .from('packages')
          .select('id, package_name, speed, price')
          .order('price', {
            ascending: true
          });

        if (packageError) {

          console.error(
            'Packages Fetch Error:',
            packageError
          );

          setErrorMessage(
            `Packages Error: ${packageError.message}`
          );

        } else if (pkgData) {

          setPackagesList(
            pkgData as PackageType[]
          );

        }

      } catch (err: any) {

        console.error(
          'Initialization Error:',
          err
        );

        setErrorMessage(
          `Initialization Error: ${
            err?.message ||
            'ڈیٹا لوڈ نہیں ہو سکا'
          }`
        );

      } finally {

        setInitializing(false);

      }

    };

    initData();

  }, [isSubmitted]);


  // =====================================================
  // PACKAGE SELECT
  // Auto Fill:
  // Package Name
  // Speed
  // Monthly Price
  // =====================================================

  const handlePackageSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {

    const packageId = e.target.value;

    setSelectedPackageId(packageId);

    if (!packageId) {

      setFormData(prev => ({
        ...prev,
        packageName: '',
        speed: '',
        monthlyPrice: ''
      }));

      return;

    }

    const selectedPackage =
      packagesList.find(
        pkg =>
          String(pkg.id) === packageId
      );

    if (selectedPackage) {

      setFormData(prev => ({
        ...prev,

        packageName:
          selectedPackage.package_name || '',

        speed:
          selectedPackage.speed || '',

        monthlyPrice:
          String(
            selectedPackage.price ?? ''
          )
      }));

    }

  };


  // =====================================================
  // NORMAL INPUT CHANGE
  // =====================================================

  const handleChange = (
    e:
      React.ChangeEvent<HTMLInputElement> |
      React.ChangeEvent<HTMLTextAreaElement>
  ) => {

    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };


  // =====================================================
  // SAVE CUSTOMER
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);
    setErrorMessage('');
    setIsSubmitted(false);

    try {

      // Package validation

      if (!formData.packageName) {

        setErrorMessage(
          'براہ کرم انٹرنیٹ پیکیج منتخب کریں۔'
        );

        setLoading(false);

        return;

      }


      // -----------------------------------------------
      // Customer Save in Supabase
      // -----------------------------------------------

      const { error } = await supabase
        .from('customers')
        .insert([
          {
            serial_number:
              formData.serialNumber,

            full_name:
              formData.fullName,

            father_name:
              formData.fatherName,

            phone:
              formData.phone,

            whatsapp:
              formData.whatsapp,

            email:
              formData.email,

            cnic:
              formData.cnic,

            address:
              formData.address,

            pppoe_username:
              formData.pppoeUsername,

            pppoe_password:
              formData.pppoePassword,

            monthly_price:
              formData.monthlyPrice
                ? parseFloat(
                    formData.monthlyPrice
                  )
                : 0,

            connection_charges:
              formData.connectionCharges
                ? parseFloat(
                    formData.connectionCharges
                  )
                : 0,

            package_name:
              formData.packageName,

            speed:
              formData.speed,

            password: '12345'
          }
        ]);


      if (error) {

        setErrorMessage(
          `Supabase Error: ${error.message}`
        );

        return;

      }


      // =================================================
      // WHATSAPP MESSAGE
      // =================================================

      const targetPhone =
        formData.whatsapp ||
        formData.phone;


      if (targetPhone) {

        const welcomeMessage =

          `🎉 *One Click | Haider Fiber Network* 🎉\n\n` +

          `محترم *${formData.fullName || 'صارف'}*!\n\n` +

          `One Click - Haider Fiber Network میں خوش آمدید۔ آپ کا نیا انٹرنیٹ کنکشن کامیابی سے رجسٹر کر دیا گیا ہے۔\n\n` +

          `━━━━━━━━━━━━━━━━━━\n` +
          `📋 *کنکشن کی تفصیلات*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +

          `🆔 *Customer ID:* ${formData.serialNumber}\n` +
          `📦 *پیکیج:* ${formData.packageName || 'Standard'}\n` +
          `⚡ *انٹرنیٹ سپیڈ:* ${formData.speed || 'N/A'}\n` +
          `💳 *کنکشن چارجز:* Rs ${formData.connectionCharges || '0'}\n` +
          `💰 *ماہانہ بل:* Rs ${formData.monthlyPrice || '0'}\n\n` +

          `━━━━━━━━━━━━━━━━━━\n` +
          `🌐 *PPPoE / Router Login*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +

          `👤 *Username:* ${formData.pppoeUsername}\n` +
          `🔐 *Password:* ${formData.pppoePassword}\n\n` +

          `━━━━━━━━━━━━━━━━━━\n` +
          `📱 *One Click Customer Portal*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +

          `اپنا بل، ادائیگی، شکایت اور اکاؤنٹ کی تفصیلات دیکھنے کے لیے One Click پورٹل استعمال کریں:\n\n` +

          `👉 https://khanfiber.vercel.app\n\n` +

          `🔑 *Portal Login Details*\n\n` +

          `👤 *Customer ID:* ${formData.serialNumber}\n` +
          `🔒 *Default Password:* 12345\n\n` +

          `⚠️ پہلی مرتبہ لاگ اِن کرنے کے بعد اپنا پاسورڈ تبدیل کر لیں۔\n\n` +

          `کسی بھی مسئلے یا مزید معلومات کے لیے ہم سے رابطہ کریں۔\n\n` +

          `شکریہ!\n` +
          `*One Click*\n` +
          `*Haider Fiber Network*`;


        openWhatsAppDirect(
          targetPhone,
          welcomeMessage
        );

      }


      // Success

      setIsSubmitted(true);


      // -----------------------------------------------
      // Reset Form
      // -----------------------------------------------

      setSelectedPackageId('');

      setFormData({
        serialNumber: 'HFN0001',
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


    } catch (err: any) {

      setErrorMessage(
        `Error: ${
          err?.message ||
          'غیر متوقع خرابی پیش آئی'
        }`
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {

    setSelectedPackageId('');

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


  // =====================================================
  // UI
  // =====================================================

  return (

    <Layout showNavButtons={true}>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%'
        }}
      >


        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',

            background:
              'linear-gradient(135deg, #111f35, #0b1729)',

            padding: '12px 15px',

            borderRadius: '14px',

            border:
              '1px solid rgba(56,189,248,0.22)',

            boxShadow:
              '0 8px 25px rgba(0,0,0,0.18)'
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
                  'rgba(6,182,212,0.12)',

                border:
                  '1px solid rgba(34,211,238,0.15)',

                padding: '8px',

                borderRadius: '10px',

                color: '#22d3ee'
              }}
            >
              <UserPlus size={20} />
            </div>

            <div>

              <h2
                style={{
                  margin: 0,

                  fontSize: '15px',

                  fontWeight: '900',

                  color: '#f8fafc'
                }}
              >
                نیا انٹرنیٹ کنکشن
              </h2>

              <p
                style={{
                  margin: '3px 0 0',

                  fontSize: '9px',

                  color: '#64748b'
                }}
              >
                One Click • Haider Fiber Network
              </p>

            </div>

          </div>

        </div>


        {/* ==========================================
            SUCCESS
        ========================================== */}

        {isSubmitted && (

          <div
            style={{
              backgroundColor:
                'rgba(16,185,129,0.10)',

              border:
                '1px solid rgba(16,185,129,0.35)',

              color: '#34d399',

              padding: '11px 14px',

              borderRadius: '11px',

              fontSize: '11px',

              display: 'flex',

              alignItems: 'center',

              gap: '8px'
            }}
          >

            <CheckCircle2 size={17} />

            نیا کنکشن کامیابی سے محفوظ ہو گیا اور واٹس ایپ ونڈو کھول دی گئی ہے۔

          </div>

        )}


        {/* ==========================================
            ERROR
        ========================================== */}

        {errorMessage && (

          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.10)',

              border:
                '1px solid rgba(239,68,68,0.35)',

              color: '#fb7185',

              padding: '11px 14px',

              borderRadius: '11px',

              fontSize: '11px',

              display: 'flex',

              alignItems: 'center',

              gap: '8px'
            }}
          >

            <AlertCircle size={17} />

            {errorMessage}

          </div>

        )}


        {/* ==========================================
            FORM
        ========================================== */}

        <form
          onSubmit={handleSubmit}
          style={{
            background:
              'linear-gradient(145deg, #0e1e34, #09182b)',

            borderRadius: '16px',

            padding: '16px',

            border:
              '1px solid rgba(148,163,184,0.12)',

            boxShadow:
              '0 12px 35px rgba(0,0,0,0.16)'
          }}
        >


          <div
            style={{
              display: 'grid',

              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',

              gap: '12px'
            }}
          >


            {/* SERIAL NUMBER */}

            <div>

              <label style={labelStyleBlue}>
                کسٹمر ID / سیریل نمبر
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="serialNumber"
                  value={
                    initializing
                      ? 'Loading...'
                      : formData.serialNumber
                  }
                  readOnly
                  style={{
                    ...inputStyle,
                    color: '#38bdf8',
                    fontWeight: 'bold',
                    border:
                      '1px solid rgba(56,189,248,0.45)'
                  }}
                />

                <Hash style={iconStyle} size={14} />

              </div>

            </div>


            {/* FULL NAME */}

            <div>

              <label style={labelStyle}>
                صارف کا نام (Full Name) *
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="صارف کا مکمل نام"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <User style={iconStyle} size={14} />

              </div>

            </div>


            {/* FATHER */}

            <div>

              <label style={labelStyle}>
                ولدیت (Father Name)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="fatherName"
                  placeholder="والد کا نام"
                  value={formData.fatherName}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <User style={iconStyle} size={14} />

              </div>

            </div>


            {/* PHONE */}

            <div>

              <label style={labelStyle}>
                فون نمبر (Mobile Number) *
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="03001234567"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                />

                <Phone style={iconStyle} size={14} />

              </div>

            </div>


            {/* WHATSAPP */}

            <div>

              <label style={labelStyle}>
                واٹس ایپ نمبر (WhatsApp)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="whatsapp"
                  placeholder="03001234567"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                />

                <MessageSquare
                  style={iconStyle}
                  size={14}
                />

              </div>

            </div>


            {/* ======================================
                PACKAGE SELECT
            ====================================== */}

            <div>

              <label style={labelStyleBlue}>
                انٹرنیٹ پیکیج (Select Package) *
              </label>

              <div style={inputWrapperStyle}>

                <select
                  required
                  value={selectedPackageId}
                  onChange={handlePackageSelect}
                  disabled={initializing}
                  style={{
                    ...inputStyle,

                    paddingRight: '32px',

                    border:
                      '1px solid rgba(56,189,248,0.45)',

                    cursor: 'pointer'
                  }}
                >

                  <option value="">
                    {initializing
                      ? 'پیکیجز لوڈ ہو رہے ہیں...'
                      : 'پیکیج منتخب کریں...'}
                  </option>

                  {packagesList.map(pkg => (

                    <option
                      key={pkg.id}
                      value={String(pkg.id)}
                    >
                      {pkg.package_name}
                      {' '}
                      ({pkg.speed})
                      {' '}
                      - Rs {pkg.price}
                    </option>

                  ))}

                </select>

                <Package
                  style={iconStyleBlue}
                  size={14}
                />

              </div>

            </div>


            {/* PACKAGE NAME AUTO */}

            <div>

              <label style={labelStyleBlue}>
                پیکیج نام (Auto)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  value={formData.packageName}
                  readOnly
                  placeholder="پیکیج کا نام"
                  style={{
                    ...inputStyle,

                    color: '#67e8f9',

                    border:
                      '1px solid rgba(34,211,238,0.30)'
                  }}
                />

                <Package
                  style={iconStyleBlue}
                  size={14}
                />

              </div>

            </div>


            {/* SPEED AUTO */}

            <div>

              <label style={labelStyleBlue}>
                انٹرنیٹ سپیڈ (Auto)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  value={formData.speed}
                  readOnly
                  placeholder="پیکیج منتخب کریں"
                  style={{
                    ...inputStyle,

                    color: '#38bdf8',

                    border:
                      '1px solid rgba(56,189,248,0.30)'
                  }}
                />

                <Gauge
                  style={iconStyleBlue}
                  size={14}
                />

              </div>

            </div>


            {/* MONTHLY PRICE AUTO */}

            <div>

              <label style={labelStyleGreen}>
                ماہانہ چارجز (Auto)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="number"
                  value={formData.monthlyPrice}
                  readOnly
                  required
                  placeholder="پیکیج منتخب کریں"
                  style={{
                    ...inputStyle,

                    color: '#34d399',

                    fontWeight: 'bold',

                    border:
                      '1px solid rgba(16,185,129,0.35)'
                  }}
                />

                <DollarSign
                  style={iconStyleGreen}
                  size={14}
                />

              </div>

            </div>


            {/* CONNECTION CHARGES */}

            <div>

              <label style={labelStylePink}>
                کنکشن چارجز (Rs)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="number"
                  name="connectionCharges"
                  placeholder="2000"
                  value={formData.connectionCharges}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,

                    color: '#f472b6',

                    fontWeight: 'bold',

                    border:
                      '1px solid rgba(236,72,153,0.35)'
                  }}
                />

                <DollarSign
                  style={iconStylePink}
                  size={14}
                />

              </div>

            </div>


            {/* EMAIL */}

            <div>

              <label style={labelStyle}>
                ای میل (Email)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="email"
                  name="email"
                  placeholder="user@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                />

                <Mail style={iconStyle} size={14} />

              </div>

            </div>


            {/* CNIC */}

            <div>

              <label style={labelStyle}>
                شناختی کارڈ (CNIC)
              </label>

              <div style={inputWrapperStyle}>

                <input
                  type="text"
                  name="cnic"
                  placeholder="35202-0000000-0"
                  value={formData.cnic}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                />

                <CreditCard
                  style={iconStyle}
                  size={14}
                />

              </div>

            </div>


            {/* ADDRESS */}

            <div
              style={{
                gridColumn: '1 / -1'
              }}
            >

              <label style={labelStyle}>
                مکمل ایڈریس (Address)
              </label>

              <div style={inputWrapperStyle}>

                <textarea
                  name="address"
                  rows={2}
                  placeholder="صارف کا مکمل پتہ درج کریں..."
                  value={formData.address}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />

                <MapPin
                  style={{
                    ...iconStyle,
                    top: '11px'
                  }}
                  size={14}
                />

              </div>

            </div>

          </div>


          {/* ==========================================
              PPPoE
          ========================================== */}

          <div
            style={{
              marginTop: '18px',

              paddingTop: '15px',

              borderTop:
                '1px solid rgba(148,163,184,0.12)'
            }}
          >

            <h3
              style={{
                margin: '0 0 11px',

                fontSize: '12px',

                fontWeight: '900',

                color: '#67e8f9'
              }}
            >
              PPPoE اکاؤنٹ کریڈینشلز
            </h3>


            <div
              style={{
                display: 'grid',

                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',

                gap: '12px'
              }}
            >


              {/* PPP USER */}

              <div>

                <label style={labelStyle}>
                  PPPoE یوزر نیم *
                </label>

                <div style={inputWrapperStyle}>

                  <input
                    type="text"
                    name="pppoeUsername"
                    required
                    placeholder="ali123"
                    value={formData.pppoeUsername}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,

                      direction: 'ltr',

                      color: '#38bdf8',

                      fontWeight: 'bold',

                      border:
                        '1px solid rgba(6,182,212,0.35)'
                    }}
                  />

                  <KeyRound
                    style={iconStyleBlue}
                    size={14}
                  />

                </div>

              </div>


              {/* PPP PASSWORD */}

              <div>

                <label style={labelStyle}>
                  PPPoE پاسورڈ *
                </label>

                <div style={inputWrapperStyle}>

                  <input
                    type="text"
                    name="pppoePassword"
                    required
                    placeholder="پاسورڈ درج کریں"
                    value={formData.pppoePassword}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,

                      direction: 'ltr',

                      color: '#38bdf8',

                      fontWeight: 'bold',

                      border:
                        '1px solid rgba(6,182,212,0.35)'
                    }}
                  />

                  <Lock
                    style={iconStyleBlue}
                    size={14}
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ==========================================
              BUTTONS
          ========================================== */}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}
          >

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{
                backgroundColor: '#1e293b',

                color: '#cbd5e1',

                padding: '9px 17px',

                borderRadius: '9px',

                fontSize: '11px',

                fontWeight: 'bold',

                border:
                  '1px solid rgba(148,163,184,0.15)',

                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',

                display: 'flex',

                alignItems: 'center',

                gap: '6px'
              }}
            >

              <RotateCcw size={14} />

              ری سیٹ

            </button>


            <button
              type="submit"
              disabled={loading || initializing}
              style={{
                background:
                  'linear-gradient(135deg, #0891b2, #2563eb)',

                color: '#ffffff',

                padding: '9px 20px',

                borderRadius: '9px',

                fontSize: '11px',

                fontWeight: 'bold',

                border: 'none',

                cursor:
                  loading || initializing
                    ? 'not-allowed'
                    : 'pointer',

                display: 'flex',

                alignItems: 'center',

                gap: '6px',

                opacity:
                  loading || initializing
                    ? 0.7
                    : 1,

                boxShadow:
                  '0 8px 20px rgba(37,99,235,0.18)'
              }}
            >

              {loading ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

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


// =====================================================
// REUSABLE INLINE STYLES
// =====================================================

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: '700',
  color: '#cbd5e1',
  marginBottom: '5px'
};


const labelStyleBlue: React.CSSProperties = {
  ...labelStyle,
  color: '#67e8f9'
};


const labelStyleGreen: React.CSSProperties = {
  ...labelStyle,
  color: '#34d399'
};


const labelStylePink: React.CSSProperties = {
  ...labelStyle,
  color: '#f472b6'
};


const inputWrapperStyle: React.CSSProperties = {
  position: 'relative'
};


const inputStyle: React.CSSProperties = {
  width: '100%',

  boxSizing: 'border-box',

  backgroundColor: '#071426',

  border:
    '1px solid rgba(100,116,139,0.30)',

  color: '#ffffff',

  padding:
    '9px 32px 9px 10px',

  borderRadius: '9px',

  fontSize: '11px',

  outline: 'none'
};


const iconStyle: React.CSSProperties = {
  position: 'absolute',

  right: '10px',

  top: '50%',

  transform: 'translateY(-50%)',

  color: '#64748b',

  pointerEvents: 'none'
};


const iconStyleBlue: React.CSSProperties = {
  ...iconStyle,
  color: '#38bdf8'
};


const iconStyleGreen: React.CSSProperties = {
  ...iconStyle,
  color: '#10b981'
};


const iconStylePink: React.CSSProperties = {
  ...iconStyle,
  color: '#ec4899'
};