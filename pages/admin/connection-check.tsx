import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  Activity, 
  Search, 
  Zap, 
  Radio, 
  CheckCircle2, 
  RefreshCw, 
  Tv, 
  TrendingUp,
  AlertTriangle,
  XCircle,
  WifiOff
} from 'lucide-react';

interface CustomerType {
  id: number;
  full_name: string;
  pppoe_username: string;
  phone: string;
  address: string;
  modem_ip?: string;
  modem_mac?: string;
}

interface ModemDiagnosticType {
  ponStatus: string;
  rxPower: number;
  txPower: number;
  signalStrength: number;
  lanCableConnected: boolean;
  opticalQuality: 'Good' | 'Warning' | 'Critical';
}

export default function ConnectionCheckPage() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  
  const [checking, setChecking] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<ModemDiagnosticType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase سے صارفین لوڈ کریں
  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await supabase.from('customers').select('*');
      if (data) setCustomers(data);
    };
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.pppoe_username && c.pppoe_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // اوریجنل موڈیم کی IP / MAC سے لائیو ڈیٹا حاصل کرنے کا فنکشن
  const handleCheckConnection = async (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.full_name || customer.pppoe_username);
    setChecking(true);
    setDiagnosticData(null);
    setErrorMessage(null);

    const ipAddress = customer.modem_ip || '192.168.100.1';
    const macAddress = customer.modem_mac || '';

    try {
      const res = await fetch(`/api/modem-status?ip=${encodeURIComponent(ipAddress)}&mac=${encodeURIComponent(macAddress)}`);
      const data = await res.json();

      if (data.success) {
        setDiagnosticData({
          ponStatus: data.ponStatus || 'Connected',
          rxPower: data.rxPower,
          txPower: data.txPower,
          signalStrength: data.signalStrength,
          lanCableConnected: data.lanCableConnected,
          opticalQuality: data.opticalQuality
        });
      } else {
        setErrorMessage(data.message || 'موڈیم سے اوریجنل ڈیٹا حاصل نہیں ہو سکا۔ تسلی کریں کہ موڈیم آن اور نیٹ ورک سے کنیکٹڈ ہے۔');
      }
    } catch (err: any) {
      setErrorMessage('موڈیم ناٹ ریچ ایبل (Modem Offline / Cable Disconnected)۔ نیٹ ورک سگنل موصول نہیں ہو رہا۔');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Layout showNavButtons={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        
        {/* ٹاپ ہیڈر */}
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
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px', color: '#fbbf24' }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                لائیو موڈیم ڈائیگنوسٹکس (Live Modem Diagnostics)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                کسٹمر کے اصلی موڈیم (ONU / ONT IP & MAC) سے براہِ راست پاور اور سگنل لائیو ڈیٹا
              </p>
            </div>
          </div>
        </div>

        {/* سرچ پینل */}
        <div style={{ backgroundColor: '#1c2541', borderRadius: '14px', padding: '16px', border: '1px solid #334155' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
              صارف منتخب کریں جس کے موڈیم کا اوریجنل ٹیسٹ کرنا ہے *
            </label>
            <input 
              type="text" 
              placeholder="نام یا PPPoE یوزر نیم سے سرچ کریں..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(null);
                setDiagnosticData(null);
                setErrorMessage(null);
              }}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#ffffff', padding: '8px 10px 8px 34px', borderRadius: '8px', fontSize: '12px' }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '28px', color: '#64748b' }} />

            {/* لسٹ ڈراپ ڈاؤن */}
            {searchTerm && !selectedCustomer && filteredCustomers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', marginTop: '4px', zIndex: 20, maxHeight: '180px', overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleCheckConnection(c)}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                  >
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{c.full_name}</span>
                    <span style={{ color: '#38bdf8', direction: 'ltr' }}>{c.pppoe_username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ٹیسٹنگ لوڈنگ اینیمیشن */}
        {checking && (
          <div style={{ backgroundColor: '#1c2541', padding: '30px', borderRadius: '14px', border: '1px solid #3b82f6', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: '#38bdf8' }} />
            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '14px' }}>
              موڈیم ({selectedCustomer?.modem_ip || '192.168.100.1'}) سے اوریجنل لائٹ سگنل چیک ہو رہا ہے...
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px' }}>براہِ کرم کچھ سیکنڈ انتظار فرمائیں</p>
          </div>
        )}

        {/* اگر موڈیم آف لائن یا رابطہ نہ ہو سکے */}
        {errorMessage && !checking && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#f87171', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={32} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>موڈیم آف لائن ہے (Modem Unreachable)</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#fca5a5' }}>{errorMessage}</p>
          </div>
        )}

        {/* اوریجنل موڈیم ڈائیگنوسٹکس رزلٹ */}
        {diagnosticData && selectedCustomer && !checking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* کسٹمر انفارمیشن بار */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>صارف: </span>
                <strong style={{ fontSize: '14px', color: '#fff', marginRight: '4px' }}>{selectedCustomer.full_name}</strong>
                <span style={{ fontSize: '11px', color: '#38bdf8', direction: 'ltr' }}> ({selectedCustomer.pppoe_username})</span>
              </div>

              <button 
                onClick={() => handleCheckConnection(selectedCustomer)}
                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} /> دوبارہ لائیو ریفریش کریں
              </button>
            </div>

            {/* اوریجنل لائٹ اور پاور کارڈز */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              {/* آپٹیکل پاور (Received Optical Power - dBm) */}
              <div style={{ backgroundColor: '#1c2541', border: `1px solid ${diagnosticData.rxPower < -25 ? '#ef4444' : '#10b981'}`, borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>فائبر آپٹک پاور (RX Power)</span>
                  <Zap size={18} style={{ color: diagnosticData.rxPower < -25 ? '#ef4444' : '#34d399' }} />
                </div>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: diagnosticData.rxPower < -25 ? '#f87171' : '#34d399' }}>
                  {diagnosticData.rxPower} dBm
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>
                  {diagnosticData.rxPower >= -23 ? 'پاور بہترین ہے (Ideal Optical Light)' : 'پاور کمزور ہے (High Attenuation)'}
                </p>
              </div>

              {/* سگنل کوالٹی فیصد */}
              <div style={{ backgroundColor: '#1c2541', border: '1px solid #3b82f6', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>سگنل سٹرینتھ (Signal Quality)</span>
                  <Radio size={18} style={{ color: '#38bdf8' }} />
                </div>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>
                  {diagnosticData.signalStrength}%
                </h2>
                <div style={{ width: '100%', backgroundColor: '#0f172a', height: '5px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${diagnosticData.signalStrength}%`, backgroundColor: '#3b82f6', height: '100%' }}></div>
                </div>
              </div>

              {/* موڈیم PON لنک سٹیٹس */}
              <div style={{ backgroundColor: '#1c2541', border: '1px solid #10b981', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>فائبر لنک سٹیٹس (PON)</span>
                  <CheckCircle2 size={18} style={{ color: '#34d399' }} />
                </div>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>
                  {diagnosticData.ponStatus}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>فائبر تار موڈیم کے ساتھ کنیکٹڈ ہے</p>
              </div>

              {/* LAN کیبل سٹیٹس */}
              <div style={{ backgroundColor: '#1c2541', border: '1px solid #8b5cf6', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>LAN کیبل اٹیچمنٹ</span>
                  <Tv size={18} style={{ color: '#a78bfa' }} />
                </div>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: 'bold', color: '#a78bfa' }}>
                  {diagnosticData.lanCableConnected ? 'Connected (Port 1)' : 'Disconnected'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>روٹر / پی سی پورٹ آن ہے</p>
              </div>

            </div>

            {/* موڈیم اوریجنل لائٹ نچوڑ */}
            <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <p style={{ margin: 0, color: '#f472b6', fontWeight: 'bold' }}>⚙️ موڈیم اوریجنل الیکٹریکل و آپٹیکل پیرامیٹرز:</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>ارسال شدہ لائٹ (TX Power):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{diagnosticData.txPower} dBm</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>آپٹیکل فائبر کیبل کوالٹی:</span>
                  <span style={{ color: diagnosticData.opticalQuality === 'Good' ? '#34d399' : '#fbbf24', fontWeight: 'bold' }}>
                    {diagnosticData.opticalQuality === 'Good' ? '✅ بہترین (Original Optical Light)' : '⚠️ لائٹ ڈراپ ہے'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}