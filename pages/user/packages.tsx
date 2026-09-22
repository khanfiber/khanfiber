import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { Package, CheckCircle2, AlertCircle, Send, Zap, Loader2 } from 'lucide-react';

interface PackageType {
  id: number;
  package_name: string;
  speed: string;
  price: number;
  description?: string;
}

export default function UserPackagesPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [currentPackage, setCurrentPackage] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        const customerId = parsedUser.id || parsedUser.customer_id;

        // 1. کسٹمر کا کرنٹ پیکج فیچ کریں
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();

        if (custData) {
          setCustomer(custData);
          setCurrentPackage(custData.package_name || '');
        }

        // 2. ایڈمن کے تمام پیکجز فیچ کریں
        const { data: pkgData, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        setPackages(pkgData || []);
      } catch (err: any) {
        setErrorMsg('پیکجز لوڈ کرنے میں ناکامی: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // پیکج تبدیل کرنے کی درخواست بھیجیں
  const handleRequestChange = async () => {
    if (!selectedPackage || !customer) return;

    if (selectedPackage.package_name === currentPackage) {
      setErrorMsg('آپ پہلے سے ہی یہ پیکج استعمال کر رہے ہیں!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('complaints')
        .insert([
          {
            customer_id: customer.id,
            customer_name: customer.full_name,
            pppoe_username: customer.pppoe_username,
            phone: customer.phone,
            subject: 'پیکج تبدیلی کی درخواست',
            description: `موجودہ پیکج: ${currentPackage} ---> نیا منتخب کردہ پیکج: ${selectedPackage.package_name} (${selectedPackage.speed} - Rs ${selectedPackage.price})`,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setSuccessMsg(`آپ کی پیکج تبدیلی (${selectedPackage.package_name}) کی درخواست ایڈمن کو بھیج دی گئی ہے!`);
      setSelectedPackage(null);
    } catch (err: any) {
      setErrorMsg('درخواست بھیجنے میں خرابی: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #f472b6', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(244, 114, 182, 0.2)', padding: '8px', borderRadius: '10px', color: '#f472b6' }}>
            <Package size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#f472b6', fontWeight: 'bold' }}>انٹرنیٹ پیکجز فہرست (Internet Packages)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنا پسندیدہ پیکج منتخب کریں اور تبدیلی کی درخواست بھیجیں</p>
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

        {/* پیکجز کی گرڈ */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#38bdf8', padding: '40px 0', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={20} className="animate-spin" /> پیکجز لوڈ ہو رہے ہیں...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {packages.map((pkg) => {
              const isCurrent = pkg.package_name === currentPackage;
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <div 
                  key={pkg.id} 
                  onClick={() => setSelectedPackage(pkg)}
                  style={{
                    backgroundColor: '#1c2541',
                    border: isSelected ? '2px solid #38bdf8' : isCurrent ? '2px solid #10b981' : '1px solid #334155',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: isSelected ? '0 8px 20px rgba(56, 189, 248, 0.25)' : 'none'
                  }}
                >
                  {/* لیبل */}
                  {isCurrent && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                      آپ کا موجودہ پیکج
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}>
                      <Zap size={16} /> {pkg.speed}
                    </div>
                    <h3 style={{ margin: '6px 0 2px 0', fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>
                      {pkg.package_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                      {pkg.description || 'فاسٹ فائبر اپ لوڈ اور ڈاؤن لوڈ سپیڈ'}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>ماہانہ چارجز</span>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#34d399', fontWeight: 'bold' }}>
                        Rs {pkg.price}
                      </h4>
                    </div>

                    <div style={{
                      backgroundColor: isSelected ? '#38bdf8' : '#0f172a',
                      color: isSelected ? '#000' : '#fff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '1px solid #3b82f6'
                    }}>
                      {isSelected ? 'منتخب شدہ' : 'منتخب کریں'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ریکویسٹ بٹن */}
        {selectedPackage && (
          <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>منتخب شدہ نیا پیکج:</p>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#38bdf8', fontWeight: 'bold' }}>
                {selectedPackage.package_name} ({selectedPackage.speed}) - Rs {selectedPackage.price}/ماہ
              </h4>
            </div>

            <button
              onClick={handleRequestChange}
              disabled={submitting}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'درخواست بھیجی جا رہی ہے...' : 'پیکج تبدیلی کی درخواست بھیجیں'}
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}