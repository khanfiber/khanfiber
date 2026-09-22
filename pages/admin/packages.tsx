import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  Package, 
  Plus, 
  Save, 
  Trash2, 
  Wifi, 
  CheckCircle2, 
  Layers,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PackageType {
  id: number;
  name: string;
  speed: string;
  price: number;
  mikrotik_profile: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    speed: '',
    price: '',
    mikrotikProfile: ''
  });

  // 1. Supabase سے تمام پیکجز فیچ کریں
  const fetchPackages = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      setErrorMessage(`ڈیٹا فیچ کرنے میں خرابی: ${error.message}`);
    } else if (data) {
      setPackages(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. نیا پیکج Supabase میں محفوظ کریں
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      const profileName = formData.mikrotikProfile || `prof_${formData.speed.replace(/\s+/g, '').toLowerCase()}`;

      const { error } = await supabase
        .from('packages')
        .insert([
          {
            name: formData.name,
            speed: formData.speed,
            price: formData.price ? parseFloat(formData.price) : 0,
            mikrotik_profile: profileName
          }
        ]);

      if (error) {
        setErrorMessage(`Supabase Error: ${error.message}`);
      } else {
        setIsSuccess(true);
        setFormData({ name: '', speed: '', price: '', mikrotikProfile: '' });
        fetchPackages(); // لسٹ دوبارہ ریفریش کریں
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(`خرابی: ${err.message || 'پیکج محفوظ نہیں ہو سکا'}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. پیکج ڈیلیٹ کریں
  const handleDelete = async (id: number) => {
    if (confirm('کیا آپ واقعی اس پیکج کو ختم کرنا چاہتے ہیں؟')) {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) {
        alert('ڈیلیٹ نہیں ہو سکا: ' + error.message);
      } else {
        fetchPackages(); // لسٹ اپ ڈیٹ کریں
      }
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
          border: '1px solid #3b82f6' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                انٹرنیٹ پیکجز سیٹ اپ (Packages Setup)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                نئے پیکجز شامل کریں اور Supabase کلاؤڈ ڈیٹا بیس میں محفوظ کریں
              </p>
            </div>
          </div>
        </div>

        {/* کامیابی کا پیغام */}
        {isSuccess && (
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.2)', 
            border: '1px solid #10b981', 
            color: '#34d399', 
            padding: '10px 14px', 
            borderRadius: '10px', 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <CheckCircle2 size={16} />
            نیا پیکج کامیابی کے ساتھ Supabase میں شامل کر دیا گیا ہے!
          </div>
        )}

        {/* خرابی کا پیغام */}
        {errorMessage && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid #ef4444', 
            color: '#f87171', 
            padding: '10px 14px', 
            borderRadius: '10px', 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* 2. نیا پیکج فارم */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '16px', 
          border: '1px solid #334155'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            نیا پیکج شامل کریں
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
            
            {/* پیکج کا نام */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                پیکج کا نام *
              </label>
              <input 
                type="text" 
                name="name" 
                required
                placeholder="مثلاً: 10 Mbps Starter"
                value={formData.name} 
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  color: '#ffffff', 
                  padding: '8px 10px', 
                  borderRadius: '8px', 
                  fontSize: '12px' 
                }} 
              />
            </div>

            {/* انٹرنیٹ سپیڈ */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                سپیڈ (Speed / Bandwidth) *
              </label>
              <input 
                type="text" 
                name="speed" 
                required
                placeholder="مثلاً: 10 Mbps"
                value={formData.speed} 
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  color: '#ffffff', 
                  padding: '8px 10px', 
                  borderRadius: '8px', 
                  fontSize: '12px' 
                }} 
              />
            </div>

            {/* ماہانہ قیمت */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                ماہانہ قیمت (Rs) *
              </label>
              <input 
                type="number" 
                name="price" 
                required
                placeholder="مثلاً: 1500"
                value={formData.price} 
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  color: '#ffffff', 
                  padding: '8px 10px', 
                  borderRadius: '8px', 
                  fontSize: '12px' 
                }} 
              />
            </div>

            {/* مائیکروٹک پروائل نام */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                مائیکروٹک پروائل (Profile)
              </label>
              <input 
                type="text" 
                name="mikrotikProfile" 
                placeholder="مثلاً: prof_10m"
                value={formData.mikrotikProfile} 
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  color: '#38bdf8', 
                  padding: '8px 10px', 
                  borderRadius: '8px', 
                  fontSize: '12px',
                  direction: 'ltr' 
                }} 
              />
            </div>

            {/* محفوظ کریں بٹن */}
            <div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#3b82f6', 
                  color: '#ffffff', 
                  padding: '9px 14px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {loading ? 'محفوظ ہو رہا ہے...' : 'پیکج محفوظ کریں'}
              </button>
            </div>

          </form>
        </div>

        {/* 3. موجودہ پیکجز کی فہرست (Supabase Table) */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '14px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#f472b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} />
            موجودہ انٹرنیٹ پیکجز (Supabase Live Data)
          </h3>

          {fetching ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              ڈیٹا لوڈ ہو رہا ہے...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>پیکج کا نام</th>
                  <th style={{ padding: '8px' }}>سپیڈ</th>
                  <th style={{ padding: '8px' }}>ماہانہ قیمت</th>
                  <th style={{ padding: '8px' }}>مائیکروٹک پروائل</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      کوئی پیکج موجود نہیں ہے۔ نیا پیکج شامل کریں۔
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg, index) => (
                    <tr key={pkg.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#ffffff' }}>{pkg.name}</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Wifi size={12} /> {pkg.speed}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#34d399', fontWeight: 'bold' }}>Rs {pkg.price}</td>
                      <td style={{ padding: '8px', color: '#cbd5e1', direction: 'ltr', textAlign: 'right' }}>{pkg.mikrotik_profile || '---'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(pkg.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                          title="ڈیلیٹ کریں"
                        >
                          <Trash2 size={12} />
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