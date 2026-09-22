import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  CreditCard, 
  Search, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  Gauge,
  User,
  DollarSign
} from 'lucide-react';

interface CustomerType {
  id: number;
  full_name: string;
  pppoe_username: string;
  phone: string;
  package_name: string;
  speed: string;
  monthly_price: number;
}

interface PackageType {
  id: number;
  name: string;
  speed: string;
  price: number;
}

export default function BillManagementPage() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);

  // ایڈٹ ہونے والی ویلیوز
  const [packageName, setPackageName] = useState('');
  const [speed, setSpeed] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Supabase سے صارفین اور پیکجز فیچ کریں
  useEffect(() => {
    const loadInitialData = async () => {
      // صارفین
      const { data: custData } = await supabase.from('customers').select('*');
      if (custData) setCustomers(custData);

      // پیکجز
      const { data: pkgData } = await supabase.from('packages').select('*');
      if (pkgData) setPackages(pkgData);
    };

    loadInitialData();
  }, []);

  // سرچ فلٹر
  const filteredCustomers = customers.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.pppoe_username && c.pppoe_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // کسٹمر منتخب کرنے کا فنکشن
  const handleSelectCustomer = (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.full_name || customer.pppoe_username);
    setPackageName(customer.package_name || '');
    setSpeed(customer.speed || '');
    setMonthlyPrice(String(customer.monthly_price || '0'));
    setErrorMessage('');
    setIsSuccess(false);
  };

  // پیکج سلیکٹ کرنے پر سپیڈ اور ریٹ خودکار اپ ڈیٹ کریں
  const handlePackageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPkgName = e.target.value;
    setPackageName(selectedPkgName);

    const foundPkg = packages.find(p => p.name === selectedPkgName);
    if (foundPkg) {
      setSpeed(foundPkg.speed);
      setMonthlyPrice(String(foundPkg.price));
    }
  };

  // 2. ترمیم محفوظ (Save) کرنا
  const handleSaveBillSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMessage('براہِ کرم پہلے کسی صارف کو سرچ کر کے منتخب کریں!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          package_name: packageName,
          speed: speed,
          monthly_price: monthlyPrice ? parseFloat(monthlyPrice) : 0
        })
        .eq('id', selectedCustomer.id);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSuccess(true);
        // لوکل اسٹیٹ اپ ڈیٹ کریں
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
          ...c,
          package_name: packageName,
          speed: speed,
          monthly_price: parseFloat(monthlyPrice) || 0
        } : c));

        setTimeout(() => setIsSuccess(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(`خرابی: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        
        {/* 1. ٹاپ بار */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#1c2541', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          border: '1px solid #38bdf8' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '8px', borderRadius: '10px', color: '#38bdf8' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                بل مینجمنٹ (Bill Management)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                صارف کا پیکیج، سپیڈ اور ماہانہ بل تبدیل یا اپ ڈیٹ کریں
              </p>
            </div>
          </div>
        </div>

        {/* کامیابی کا پیغام */}
        {isSuccess && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            صارف کا پیکیج اور ماہانہ بل کامیابی سے اپ ڈیٹ ہو گیا ہے!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* 2. سرچ اور سیٹنگز فارم */}
        <div style={{ backgroundColor: '#1c2541', borderRadius: '14px', padding: '16px', border: '1px solid #334155' }}>
          
          {/* یوزر سرچ ان پٹ */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
              صارف کا نام یا PPPoE یوزر نیم سرچ کریں *
            </label>
            <input 
              type="text" 
              placeholder="نام یا یوزر نیم لکھیں..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(null);
              }}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '8px 10px 8px 32px', borderRadius: '8px', fontSize: '12px' }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '28px', color: '#64748b' }} />

            {/* ڈراپ ڈاؤن سرچ لسٹ */}
            {searchTerm && !selectedCustomer && filteredCustomers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', marginTop: '4px', zIndex: 20, maxHeight: '180px', overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectCustomer(c)}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                  >
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{c.full_name}</span>
                    <span style={{ color: '#38bdf8', direction: 'ltr' }}>{c.pppoe_username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* سیٹنگز فارم */}
          <form onSubmit={handleSaveBillSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* 1. منتخب صارف کا نام (Read Only) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>
                منتخب صارف
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  readOnly 
                  placeholder="کوئی صارف نہیں چنا گیا"
                  value={selectedCustomer ? `${selectedCustomer.full_name} (${selectedCustomer.pppoe_username})` : ''} 
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f472b6', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <User size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              </div>
            </div>

            {/* 2. پیکج منتخب کریں (ڈراپ ڈاؤن) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                پیکج تبدیل کریں (Package Name)
              </label>
              <select 
                value={packageName} 
                onChange={handlePackageSelect}
                disabled={!selectedCustomer}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
              >
                <option value="">-- کسٹم یا نیا پیکج چنیں --</option>
                {packages.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.speed} - Rs {p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. انٹرنیٹ سپیڈ */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                انٹرنیٹ سپیڈ (Speed)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="مثلاً: 10 Mbps"
                  value={speed} 
                  onChange={(e) => setSpeed(e.target.value)}
                  disabled={!selectedCustomer}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Gauge size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#38bdf8' }} />
              </div>
            </div>

            {/* 4. ماہانہ بل */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>
                ماہانہ بل (Monthly Bill - Rs) *
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  placeholder="1500"
                  value={monthlyPrice} 
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  disabled={!selectedCustomer}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #10b981', color: '#34d399', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#10b981' }} />
              </div>
            </div>

            {/* سبمٹ بٹن */}
            <div style={{ gridColumn: 'span 1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="submit" 
                disabled={loading || !selectedCustomer}
                style={{ backgroundColor: '#3b82f6', color: '#ffffff', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: selectedCustomer ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', opacity: selectedCustomer ? 1 : 0.6 }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {loading ? 'محفوظ ہو رہا ہے...' : 'سیٹنگز محفوظ کریں'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </Layout>
  );
}