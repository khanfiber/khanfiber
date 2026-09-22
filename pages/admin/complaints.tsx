import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { openWhatsAppDirect } from '../../lib/whatsapp';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Loader2,
  MessageSquare,
  Wrench
} from 'lucide-react';

interface ComplaintType {
  id: number;
  customer_id: number;
  complaint_type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  customers?: {
    full_name: string;
    pppoe_username: string;
    phone: string;
    whatsapp: string;
    address: string;
  };
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Supabase سے لائیو شکایات لوڈ کرنا
  const fetchComplaints = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        customers (
          full_name,
          pppoe_username,
          phone,
          whatsapp,
          address
        )
      `)
      .order('id', { ascending: false });

    if (data) {
      setComplaints(data as ComplaintType[]);
    }
    if (error) console.error('Complaint fetch error:', error);
    setFetching(false);
  };

  useEffect(() => {
    fetchComplaints();

    // Supabase Realtime Subscription (فوراً لائیو اپ ڈیٹ کے لیے)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaints' },
        () => fetchComplaints()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // فلٹر کی ہوئی شکایات
  const filteredComplaints = complaints.filter((c) => {
    const matchesTab = activeTab === 'pending' ? c.status !== 'resolved' : c.status === 'resolved';
    const search = searchTerm.toLowerCase();
    const name = c.customers?.full_name?.toLowerCase() || '';
    const username = c.customers?.pppoe_username?.toLowerCase() || '';
    const type = c.complaint_type?.toLowerCase() || '';

    return matchesTab && (name.includes(search) || username.includes(search) || type.includes(search));
  });

  // شکایت کا سٹیٹس اپ ڈیٹ کرنا (مثلاً Resolved / In Progress)
  const handleUpdateStatus = async (complaint: ComplaintType, newStatus: 'in_progress' | 'resolved') => {
    setActionLoading(complaint.id);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaint.id);

      if (error) throw error;

      // اگر شکایت حل ہو گئی ہے تو کسٹمر کو واٹس ایپ اپ ڈیٹ بھیجیں
      if (newStatus === 'resolved') {
        const targetPhone = complaint.customers?.whatsapp || complaint.customers?.phone;
        if (targetPhone) {
          const msg = 
            `*خان فائبر انٹرنیٹ نیٹ ورک - شکایت ازالہ*\n\n` +
            `محترم *${complaint.customers?.full_name || ''}*!\n` +
            `آپ کی شکایت (*${complaint.complaint_type}*) کامیابی کے ساتھ حل کر دی گئی ہے۔\n\n` +
            `انٹرنیٹ سروس استعمال کرنے کا شکریہ!\n` +
            `*خان فائبر ٹیم*`;

          openWhatsAppDirect(targetPhone, msg);
        }
      }

      fetchComplaints();
    } catch (err: any) {
      alert('سٹیٹس اپ ڈیٹ کرنے میں خرابی: ' + err.message);
    } finally {
      setActionLoading(null);
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
          border: '1px solid #ef4444' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '10px', color: '#f87171' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>
                کیبل و انٹرنیٹ شکایات (Complaints Center)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>
                صارفین کی طرف سے موصول ہونے والی لائیو شکایات کا ازالہ کریں
              </p>
            </div>
          </div>
        </div>

        {/* 2. ٹیب سوئچر و سرچ بار */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '12px', 
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* ٹیبز */}
          <div style={{ backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px', display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'pending' ? '#991b1b' : 'transparent',
                color: activeTab === 'pending' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Clock size={14} />
              پینڈنگ / جاری شکایات ({complaints.filter(c => c.status !== 'resolved').length})
            </button>

            <button
              onClick={() => setActiveTab('resolved')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'resolved' ? '#065f46' : 'transparent',
                color: activeTab === 'resolved' ? '#ffffff' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={14} />
              حل شدہ شکایات ({complaints.filter(c => c.status === 'resolved').length})
            </button>
          </div>

          {/* سرچ ان پٹ */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text"
                placeholder="صارف کا نام، یوزر نیم یا شکایت سرچ کریں..."
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
              onClick={fetchComplaints}
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
              ریفریش
            </button>
          </div>
        </div>

        {/* 3. شکایات کی فہرست (Table) */}
        <div style={{ 
          backgroundColor: '#1c2541', 
          borderRadius: '14px', 
          padding: '14px', 
          border: '1px solid #334155',
          overflowX: 'auto'
        }}>
          {fetching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#38bdf8', fontSize: '12px' }}>
              شکایات لوڈ ہو رہی ہیں...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>صارف</th>
                  <th style={{ padding: '8px' }}>شکایت کی قسم</th>
                  <th style={{ padding: '8px' }}>تفصیل / پتہ</th>
                  <th style={{ padding: '8px' }}>تاریخ</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>سٹیٹس</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>اقدامات (Action)</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      کوئی شکایت موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c, index) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                        <div>{c.customers?.full_name || 'نامعلوم'}</div>
                        <div style={{ fontSize: '10px', color: '#38bdf8', direction: 'ltr', textAlign: 'right' }}>
                          {c.customers?.pppoe_username}
                        </div>
                      </td>
                      <td style={{ padding: '8px', color: '#f87171', fontWeight: 'bold' }}>
                        {c.complaint_type}
                      </td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>
                        <div>{c.description || '---'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{c.customers?.address}</div>
                      </td>
                      <td style={{ padding: '8px', color: '#94a3b8', fontSize: '11px' }}>
                        {new Date(c.created_at).toLocaleDateString('ur-PK')}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {c.status === 'pending' && (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                            پینڈنگ
                          </span>
                        )}
                        {c.status === 'in_progress' && (
                          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                            جاری ہے
                          </span>
                        )}
                        {c.status === 'resolved' && (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                            حل شدہ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {c.status !== 'resolved' ? (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button 
                              onClick={() => handleUpdateStatus(c, 'in_progress')}
                              disabled={actionLoading === c.id}
                              style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                            >
                              جاری ہے
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(c, 'resolved')}
                              disabled={actionLoading === c.id}
                              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                            >
                              حل ہو گئی
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#34d399' }}>مکمل</span>
                        )}
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