import React, { useEffect, useState } from 'react';
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
  Package,
  RefreshCw
} from 'lucide-react';

/* =========================
   TYPES
========================= */

interface PackageType {
  id: number;
  name: string;
  speed: string;
  price: number;
}

interface FormDataType {
  serialNumber: string;
  fullName: string;
  fatherName: string;
  phone: string;
  whatsapp: string;
  email: string;
  cnic: string;
  address: string;
  pppoeUsername: string;
  pppoePassword: string;
  monthlyPrice: string;
  connectionCharges: string;
  packageId: string;
  packageName: string;
  speed: string;
}

/* =========================
   DEFAULT FORM
========================= */

const initialFormData: FormDataType = {
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
  packageId: '',
  packageName: '',
  speed: ''
};

export default function NewConnection() {
  const [formData, setFormData] =
    useState<FormDataType>(initialFormData);

  const [packagesList, setPackagesList] =
    useState<PackageType[]>([]);

  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] =
    useState(true);

  const [serialLoading, setSerialLoading] =
    useState(false);

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =========================================================
     FORMAT SERIAL NUMBER

     HFN1    -> HFN0001
     HFN50   -> HFN0050
     HFN0050 -> HFN0050
  ========================================================= */

  const formatSerialNumber = (
    value: string
  ): string => {
    const cleanValue = value
      .toUpperCase()
      .replace(/\s+/g, '');

    const match = cleanValue.match(/^HFN(\d+)$/);

    if (!match) {
      return cleanValue;
    }

    const number = parseInt(match[1], 10);

    if (!number || number < 1) {
      return cleanValue;
    }

    return `HFN${String(number).padStart(4, '0')}`;
  };

  /* =========================================================
     GET FIRST AVAILABLE / MISSING SERIAL

     Example:

     Existing:
     HFN0001
     HFN0002
     HFN0004

     Auto:
     HFN0003

     If no gap:
     HFN0005
  ========================================================= */

  const getNextAvailableSerial =
    async (): Promise<string> => {
      const { data, error } = await supabase
        .from('customers')
        .select('serial_number')
        .like('serial_number', 'HFN%');

      if (error) {
        throw new Error(
          `Serial Number Error: ${error.message}`
        );
      }

      const usedNumbers = new Set<number>();

      (data || []).forEach((customer: any) => {
        const serial = String(
          customer.serial_number || ''
        )
          .trim()
          .toUpperCase();

        const match = serial.match(/^HFN(\d+)$/);

        if (match) {
          const number = parseInt(match[1], 10);

          if (number > 0) {
            usedNumbers.add(number);
          }
        }
      });

      let nextNumber = 1;

      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }

      return `HFN${String(nextNumber).padStart(
        4,
        '0'
      )}`;
    };

  /* =========================================================
     AUTO SERIAL
  ========================================================= */

  const generateAutoSerial = async () => {
    setSerialLoading(true);

    try {
      const nextSerial =
        await getNextAvailableSerial();

      setFormData(prev => ({
        ...prev,
        serialNumber: nextSerial
      }));
    } catch (err: any) {
      console.error(
        'Auto Serial Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'سیریل نمبر بنانے میں خرابی پیش آئی۔'
      );
    } finally {
      setSerialLoading(false);
    }
  };

  /* =========================================================
     LOAD SERIAL NUMBER + PACKAGES
  ========================================================= */

  const loadInitialData = async () => {
    setPackagesLoading(true);
    setSerialLoading(true);
    setErrorMessage('');

    try {
      /* =========================
         1. FIRST AVAILABLE SERIAL
      ========================= */

      const nextSerial =
        await getNextAvailableSerial();

      setFormData(prev => ({
        ...prev,
        serialNumber: nextSerial
      }));

      /* =========================
         2. LOAD PACKAGES
      ========================= */

      const { data: pkgData, error: pkgError } =
        await supabase
          .from('packages')
          .select('id, name, speed, price')
          .order('price', { ascending: true });

      if (pkgError) {
        console.error(
          'Packages Error:',
          pkgError.message
        );

        setErrorMessage(
          `Packages Error: ${pkgError.message}`
        );

        setPackagesList([]);
      } else {
        const cleanPackages: PackageType[] =
          (pkgData || []).map((pkg: any) => ({
            id: Number(pkg.id),
            name: String(pkg.name || ''),
            speed: String(pkg.speed || ''),
            price: Number(pkg.price || 0)
          }));

        setPackagesList(cleanPackages);
      }
    } catch (err: any) {
      console.error(
        'Initialization Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'ابتدائی ڈیٹا لوڈ کرنے میں خرابی پیش آئی۔'
      );
    } finally {
      setPackagesLoading(false);
      setSerialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  /* =========================================================
     NORMAL INPUT CHANGE
  ========================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* =========================================================
     SERIAL MANUAL CHANGE
  ========================================================= */

  const handleSerialChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value
      .toUpperCase()
      .replace(/\s+/g, '');

    /*
      Only allow:
      H
      HF
      HFN
      HFN0
      HFN0050 etc.
    */

    if (
      value === '' ||
      'HFN'.startsWith(value) ||
      /^HFN\d*$/.test(value)
    ) {
      setFormData(prev => ({
        ...prev,
        serialNumber: value
      }));

      setErrorMessage('');
    }
  };

  /* =========================================================
     SERIAL BLUR FORMAT
  ========================================================= */

  const handleSerialBlur = () => {
    if (!formData.serialNumber.trim()) {
      generateAutoSerial();
      return;
    }

    const formatted = formatSerialNumber(
      formData.serialNumber
    );

    setFormData(prev => ({
      ...prev,
      serialNumber: formatted
    }));
  };

  /* =========================================================
     PACKAGE SELECT
  ========================================================= */

  const handlePackageSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedPackageId = e.target.value;

    if (!selectedPackageId) {
      setFormData(prev => ({
        ...prev,
        packageId: '',
        packageName: '',
        speed: '',
        monthlyPrice: ''
      }));

      return;
    }

    const selectedPackage = packagesList.find(
      pkg => String(pkg.id) === selectedPackageId
    );

    if (!selectedPackage) {
      setErrorMessage(
        'منتخب کیا گیا پیکیج نہیں ملا۔'
      );

      return;
    }

    setErrorMessage('');

    setFormData(prev => ({
      ...prev,
      packageId: String(selectedPackage.id),
      packageName: selectedPackage.name,
      speed: selectedPackage.speed,
      monthlyPrice: String(selectedPackage.price)
    }));
  };

  /* =========================================================
     SUBMIT NEW CONNECTION
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage('');
    setIsSubmitted(false);

    try {
      /* =========================
         FORMAT + VALIDATE SERIAL
      ========================= */

      const finalSerial =
        formatSerialNumber(
          formData.serialNumber
        );

      if (!/^HFN\d{4,}$/.test(finalSerial)) {
        throw new Error(
          'کسٹمر ID درست فارمیٹ میں درج کریں۔ مثال: HFN0001 یا HFN0050'
        );
      }

      /* =========================
         NORMAL VALIDATIONS
      ========================= */

      if (!formData.fullName.trim()) {
        throw new Error(
          'صارف کا نام درج کریں۔'
        );
      }

      if (!formData.phone.trim()) {
        throw new Error(
          'فون نمبر درج کریں۔'
        );
      }

      if (!formData.packageId) {
        throw new Error(
          'انٹرنیٹ پیکیج منتخب کریں۔'
        );
      }

      if (!formData.packageName) {
        throw new Error(
          'پیکیج کا نام موجود نہیں۔'
        );
      }

      if (!formData.speed) {
        throw new Error(
          'پیکیج کی سپیڈ موجود نہیں۔'
        );
      }

      if (!formData.monthlyPrice) {
        throw new Error(
          'ماہانہ چارجز موجود نہیں۔'
        );
      }

      if (!formData.pppoeUsername.trim()) {
        throw new Error(
          'PPPoE یوزر نیم درج کریں۔'
        );
      }

      if (!formData.pppoePassword.trim()) {
        throw new Error(
          'PPPoE پاسورڈ درج کریں۔'
        );
      }

      /* =========================
         CHECK SERIAL DUPLICATE

         Same serial cannot be assigned
         to another customer.
      ========================= */

      const {
        data: existingSerial,
        error: serialCheckError
      } = await supabase
        .from('customers')
        .select(
          'id, serial_number, full_name'
        )
        .eq('serial_number', finalSerial)
        .maybeSingle();

      if (serialCheckError) {
        throw new Error(
          `Serial Check Error: ${serialCheckError.message}`
        );
      }

      if (existingSerial) {
        throw new Error(
          `${finalSerial} پہلے ہی ${existingSerial.full_name || 'ایک صارف'} کو دیا جا چکا ہے۔ دوسرا سیریل نمبر منتخب کریں۔`
        );
      }

      /* =========================
         INSERT CUSTOMER
      ========================= */

      const { error: insertError } =
        await supabase
          .from('customers')
          .insert([
            {
              serial_number: finalSerial,

              full_name:
                formData.fullName.trim(),

              father_name:
                formData.fatherName.trim(),

              phone:
                formData.phone.trim(),

              whatsapp:
                formData.whatsapp.trim(),

              email:
                formData.email.trim() || null,

              cnic:
                formData.cnic.trim(),

              address:
                formData.address.trim(),

              pppoe_username:
                formData.pppoeUsername.trim(),

              pppoe_password:
                formData.pppoePassword.trim(),

              monthly_price:
                Number(formData.monthlyPrice) || 0,

              connection_charges:
                Number(
                  formData.connectionCharges
                ) || 0,

              package_name:
                formData.packageName,

              speed:
                formData.speed,

              password: '12345'
            }
          ]);

      if (insertError) {
        /*
          If database has UNIQUE constraint
          on serial_number, duplicate is also
          blocked here.
        */

        if (
          insertError.code === '23505'
        ) {
          throw new Error(
            `${finalSerial} پہلے سے کسی صارف کو دیا جا چکا ہے۔`
          );
        }

        throw new Error(
          `Supabase Error: ${insertError.message}`
        );
      }

      /* =========================
         SUCCESS
      ========================= */

      setIsSubmitted(true);

      /* =========================
         WHATSAPP MESSAGE
      ========================= */

      const targetPhone =
        formData.whatsapp.trim() ||
        formData.phone.trim();

      if (targetPhone) {
        const welcomeMessage =
`🌐 *ONE CLICK - HAIDER FIBER NETWORK* 🌐

🎉 *نیا انٹرنیٹ کنکشن مبارک!* 🎉

محترم *${formData.fullName || 'صارف'}*!

*One Click - Haider Fiber Network* میں خوش آمدید۔

آپ کا نیا انٹرنیٹ کنکشن کامیابی سے رجسٹر کر دیا گیا ہے۔

━━━━━━━━━━━━━━
📋 *کنکشن کی تفصیلات*
━━━━━━━━━━━━━━

🆔 *کسٹمر ID:* ${finalSerial}

👤 *نام:* ${formData.fullName}

📦 *پیکیج:* ${formData.packageName}

⚡ *انٹرنیٹ سپیڈ:* ${formData.speed}

💰 *ماہانہ چارجز:* Rs ${Number(
          formData.monthlyPrice
        ).toLocaleString()}

🔧 *کنکشن چارجز:* Rs ${Number(
          formData.connectionCharges || 0
        ).toLocaleString()}

━━━━━━━━━━━━━━
🔐 *PPPoE Login*
━━━━━━━━━━━━━━

👤 *PPPoE Username:* ${formData.pppoeUsername}

🔑 *PPPoE Password:* ${formData.pppoePassword}

━━━━━━━━━━━━━━
📱 *Customer Portal*
━━━━━━━━━━━━━━

🌐 https://khanfiber.vercel.app

🆔 *Customer ID:* ${finalSerial}

🔒 *Default Password:* 12345

⚠️ سیکیورٹی کے لیے پورٹل میں لاگ اِن ہونے کے بعد اپنا پاسورڈ تبدیل کر لیں۔

━━━━━━━━━━━━━━

شکریہ ❤️

*One Click*
*Haider Fiber Network (SMC-Private) Limited*
Your Network Solution`;

        try {
          openWhatsAppDirect(
            targetPhone,
            welcomeMessage
          );
        } catch (whatsappError) {
          console.error(
            'WhatsApp Error:',
            whatsappError
          );
        }
      }

      /* =========================
         CLEAR FORM
      ========================= */

      setFormData({
        ...initialFormData,
        serialNumber: ''
      });

      /*
        Immediately find next
        first available/missing serial.
      */

      try {
        const nextSerial =
          await getNextAvailableSerial();

        setFormData({
          ...initialFormData,
          serialNumber: nextSerial
        });
      } catch (serialError) {
        console.error(
          'Next Serial Error:',
          serialError
        );
      }

    } catch (err: any) {
      console.error(
        'New Connection Error:',
        err
      );

      setErrorMessage(
        err?.message ||
          'غیر متوقع خرابی پیش آئی۔'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESET
  ========================================================= */

  const handleReset = async () => {
    setErrorMessage('');
    setIsSubmitted(false);

    setFormData({
      ...initialFormData,
      serialNumber: ''
    });

    await generateAutoSerial();
  };

  /* =========================================================
     COMMON STYLES
  ========================================================= */

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background:
      'linear-gradient(135deg, #071525 0%, #091b2d 100%)',
    border: '1px solid #1e4663',
    color: '#ffffff',
    padding: '12px 40px 12px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const autoInputStyle: React.CSSProperties = {
    ...inputStyle,
    border: '1px solid #0891b2',
    color: '#67e8f9',
    fontWeight: '700',
    background:
      'linear-gradient(135deg, #071b2a 0%, #082336 100%)'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '6px'
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '13px',
    top: '13px',
    color: '#64748b'
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Layout showNavButtons={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* PAGE HEADER */}

        <div
          style={{
            background:
              'linear-gradient(135deg, #081a2c 0%, #0b2035 55%, #09283a 100%)',
            border: '1px solid #164e63',
            borderRadius: '18px',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow:
              '0 10px 35px rgba(0,0,0,0.22)'
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
                borderRadius: '15px',
                background:
                  'linear-gradient(135deg, rgba(6,182,212,.25), rgba(14,116,144,.15))',
                border:
                  '1px solid rgba(34,211,238,.25)',
                color: '#22d3ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserPlus size={26} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#f8fafc'
                }}
              >
                نیا انٹرنیٹ کنکشن
              </h2>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#64748b',
                  fontSize: '11px',
                  direction: 'ltr'
                }}
              >
                One Click • Haider Fiber Network
              </p>
            </div>
          </div>
        </div>

        {/* SUCCESS */}

        {isSubmitted && (
          <div
            style={{
              background:
                'rgba(16,185,129,0.10)',
              border:
                '1px solid rgba(16,185,129,0.50)',
              color: '#34d399',
              padding: '13px 15px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} />
            نیا کنکشن کامیابی سے محفوظ ہو گیا ہے۔
          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div
            style={{
              background:
                'rgba(244,63,94,0.10)',
              border:
                '1px solid rgba(244,63,94,0.45)',
              color: '#fb7185',
              padding: '13px 15px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          style={{
            background:
              'linear-gradient(145deg, #0b1b2e 0%, #0b2034 100%)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #183a55',
            boxShadow:
              '0 15px 40px rgba(0,0,0,.20)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}
          >
            {/* SERIAL */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#67e8f9'
                }}
              >
                کسٹمر ID / سیریل نمبر
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '7px'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    flex: 1
                  }}
                >
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={handleSerialChange}
                    onBlur={handleSerialBlur}
                    placeholder="HFN0001"
                    maxLength={12}
                    style={{
                      ...autoInputStyle,
                      direction: 'ltr',
                      paddingLeft: '12px',
                      paddingRight: '40px'
                    }}
                  />

                  <Hash
                    size={17}
                    style={{
                      ...iconStyle,
                      color: '#22d3ee'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={generateAutoSerial}
                  disabled={serialLoading}
                  title="پہلا خالی سیریل نمبر حاصل کریں"
                  style={{
                    width: '44px',
                    minWidth: '44px',
                    borderRadius: '12px',
                    border:
                      '1px solid #0891b2',
                    background:
                      'rgba(8,145,178,.15)',
                    color: '#67e8f9',
                    cursor: serialLoading
                      ? 'not-allowed'
                      : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {serialLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw size={17} />
                  )}
                </button>
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '5px'
                }}
              >
                Auto: پہلا خالی نمبر • Manual بھی درج کر سکتے ہیں
              </div>
            </div>

            {/* FULL NAME */}

            <div>
              <label style={labelStyle}>
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
                  style={inputStyle}
                />

                <User
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* FATHER */}

            <div>
              <label style={labelStyle}>
                ولدیت (Father Name)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="fatherName"
                  placeholder="والد کا نام"
                  value={formData.fatherName}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <User
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* PHONE */}

            <div>
              <label style={labelStyle}>
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
                  style={{
                    ...inputStyle,
                    direction: 'ltr'
                  }}
                />

                <Phone
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* WHATSAPP */}

            <div>
              <label style={labelStyle}>
                واٹس ایپ نمبر (WhatsApp)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="whatsapp"
                  placeholder="03001234567"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr'
                  }}
                />

                <MessageSquare
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* PACKAGE */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#67e8f9'
                }}
              >
                انٹرنیٹ پیکیج (Select Package) *
              </label>

              <div style={{ position: 'relative' }}>
                <select
                  required
                  value={formData.packageId}
                  onChange={handlePackageSelect}
                  disabled={packagesLoading}
                  style={{
                    ...autoInputStyle,
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">
                    {packagesLoading
                      ? 'پیکیجز لوڈ ہو رہے ہیں...'
                      : 'پیکیج منتخب کریں...'}
                  </option>

                  {packagesList.map(pkg => (
                    <option
                      key={pkg.id}
                      value={String(pkg.id)}
                    >
                      {pkg.name} - {pkg.speed} - Rs{' '}
                      {Number(
                        pkg.price
                      ).toLocaleString()}
                    </option>
                  ))}
                </select>

                <Package
                  size={17}
                  style={{
                    ...iconStyle,
                    color: '#22d3ee',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {/* PACKAGE NAME */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#67e8f9'
                }}
              >
                پیکیج نام (Auto)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.packageName}
                  readOnly
                  placeholder="پیکیج کا نام"
                  style={autoInputStyle}
                />

                <Package
                  size={17}
                  style={{
                    ...iconStyle,
                    color: '#22d3ee'
                  }}
                />
              </div>
            </div>

            {/* SPEED */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#67e8f9'
                }}
              >
                انٹرنیٹ سپیڈ (Auto)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.speed}
                  readOnly
                  placeholder="پیکیج کی سپیڈ"
                  style={autoInputStyle}
                />

                <Gauge
                  size={17}
                  style={{
                    ...iconStyle,
                    color: '#22d3ee'
                  }}
                />
              </div>
            </div>

            {/* MONTHLY PRICE */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#34d399'
                }}
              >
                ماہانہ چارجز (Auto)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={formData.monthlyPrice}
                  readOnly
                  placeholder="ماہانہ چارجز"
                  style={{
                    ...autoInputStyle,
                    border:
                      '1px solid #059669',
                    color: '#34d399'
                  }}
                />

                <DollarSign
                  size={17}
                  style={{
                    ...iconStyle,
                    color: '#34d399'
                  }}
                />
              </div>
            </div>

            {/* CONNECTION CHARGES */}

            <div>
              <label
                style={{
                  ...labelStyle,
                  color: '#f472b6'
                }}
              >
                کنکشن چارجز
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  name="connectionCharges"
                  min="0"
                  placeholder="مثلاً 2000"
                  value={
                    formData.connectionCharges
                  }
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    border:
                      '1px solid #9d174d',
                    color: '#f9a8d4'
                  }}
                />

                <DollarSign
                  size={17}
                  style={{
                    ...iconStyle,
                    color: '#f472b6'
                  }}
                />
              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label style={labelStyle}>
                ای میل (Email)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="user@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr'
                  }}
                />

                <Mail
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>

            {/* CNIC */}

            <div>
              <label style={labelStyle}>
                شناختی کارڈ (CNIC)
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="cnic"
                  placeholder="35202-0000000-0"
                  value={formData.cnic}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    direction: 'ltr'
                  }}
                />

                <CreditCard
                  size={17}
                  style={iconStyle}
                />
              </div>
            </div>
          </div>

          {/* ADDRESS */}

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>
              مکمل ایڈریس (Address)
            </label>

            <div style={{ position: 'relative' }}>
              <textarea
                name="address"
                rows={3}
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
                size={17}
                style={iconStyle}
              />
            </div>
          </div>

          {/* PPPOE SECTION */}

          <div
            style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop:
                '1px solid #183a55'
            }}
          >
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: '14px',
                color: '#67e8f9'
              }}
            >
              🔐 PPPoE اکاؤنٹ تفصیلات
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
              }}
            >
              {/* PPPOE USER */}

              <div>
                <label style={labelStyle}>
                  PPPoE یوزر نیم *
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="pppoeUsername"
                    required
                    placeholder="مثلاً ali123"
                    value={
                      formData.pppoeUsername
                    }
                    onChange={handleChange}
                    style={{
                      ...autoInputStyle,
                      direction: 'ltr'
                    }}
                  />

                  <KeyRound
                    size={17}
                    style={{
                      ...iconStyle,
                      color: '#22d3ee'
                    }}
                  />
                </div>
              </div>

              {/* PPPOE PASSWORD */}

              <div>
                <label style={labelStyle}>
                  PPPoE پاسورڈ *
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="pppoePassword"
                    required
                    placeholder="PPPoE پاسورڈ"
                    value={
                      formData.pppoePassword
                    }
                    onChange={handleChange}
                    style={{
                      ...autoInputStyle,
                      direction: 'ltr'
                    }}
                  />

                  <Lock
                    size={17}
                    style={{
                      ...iconStyle,
                      color: '#22d3ee'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{
                background: '#1e293b',
                color: '#cbd5e1',
                padding: '11px 18px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid #334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              <RotateCcw size={16} />
              ری سیٹ
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                packagesLoading ||
                serialLoading
              }
              style={{
                background:
                  loading ||
                  packagesLoading ||
                  serialLoading
                    ? '#155e75'
                    : 'linear-gradient(135deg, #0891b2, #2563eb)',
                color: '#ffffff',
                padding: '11px 22px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '800',
                border: 'none',
                cursor:
                  loading ||
                  packagesLoading ||
                  serialLoading
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow:
                  '0 8px 25px rgba(8,145,178,.20)'
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  محفوظ ہو رہا ہے...
                </>
              ) : (
                <>
                  <Save size={16} />
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