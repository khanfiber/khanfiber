import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Loader2,
  FileText
} from 'lucide-react';

interface ComplaintType {
  id: number;
  subject: string;
  description: string;
  status: 'pending' | 'resolved' | 'in_progress';
  created_at: string;
}

export default function UserComplaintsPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const customerId = parsedUser.id || parsedUser.customer_id;

      // کسٹمر کا ڈیٹا
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (custData) setCustomer(custData);

      // کسٹمر کی شکایات ہسٹری فیچ کریں
      const { data: compData, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('customer_id', customerId)
        .order('id', { ascending: false });

      if (error) throw error;
      setComplaints(compData || []);
    } catch (err: any) {
      console.error('Complaints Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // نئی شکایت سبمٹ کریں
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

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
            subject: subject.trim(),
            description: description.trim(),
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setSuccessMsg('آپ کی شکایت کامیابی کے ساتھ درج کر لی گئی ہے۔ ہماری ٹیم جلد آپ سے رابطہ کرے گی!');
      setSubject('');
      setDescription('');
      fetchComplaints(); // ہسٹری دوبارہ اپ ڈیٹ کریں
    } catch (err: any) {
      setErrorMsg('شکایت درج کرنے میں خرابی پیش آئی: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout showNavButtons={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* ٹاپ بار */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #ef4444', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '10px', color: '#f87171' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#f87171', fontWeight: 'bold' }}>شکایات سینٹر (Complaints Center)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd' }}>اپنے کنکشن سے متعلق کسی بھی مسئلے یا شکایت کا اندراج کریں</p>
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

        {/* 1. شکایت درج کرنے کا فارم */}
        <form onSubmit={handleSubmitComplaint} style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} /> نئی شکایت درج کریں
          </h3>

          {/* عنوان / مسئلہ */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
              شکایت کا عنوان / مسئلہ *
            </label>
            <input 
              type="text" 
              required
              placeholder="مثلاً: انٹرنیٹ کی سپیڈ کم ہے / لاگ ان نہیں ہو رہا" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          {/* تفصیل */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#93c5fd', marginBottom: '4px', fontWeight: 'bold' }}>
              مسئلے کی مکمل تفصیل *
            </label>
            <textarea 
              rows={4}
              required
              placeholder="براہِ کرم مسئلے کی تفصیل، وقت اور کوئی خاص مسئلہ بیان کریں..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* بٹن */}
          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              backgroundColor: '#ef4444', 
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
              gap: '6px' 
            }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'شکایت رجسٹر ہو رہی ہے...' : 'شکایت ایڈمن کو بھیجیں'}
          </button>
        </form>

        {/* 2. درج کروائی گئی شکایات کی فہرست (History) */}
        <div style={{ backgroundColor: '#1c2541', border: '1px solid #334155', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            <FileText size={16} /> آپ کی سابقہ شکایات (Complaint History)
          </h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px 0' }}>شکایات فیچ ہو رہی ہیں...</p>
          ) : complaints.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '20px 0' }}>آپ کی کوئی درج شدہ شکایت موجود نہیں ہے!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {complaints.map((item) => {
                const isResolved = item.status === 'resolved';
                return (
                  <div 
                    key={item.id}
                    style={{ 
                      backgroundColor: '#0f172a', 
                      border: `1px solid ${isResolved ? '#10b981' : '#f59e0b'}`, 
                      borderRadius: '12px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }}>{item.subject}</h4>
                      
                      {/* سٹیٹس بیج */}
                      <span style={{ 
                        backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                        color: isResolved ? '#34d399' : '#fbbf24', 
                        border: `1px solid ${isResolved ? '#10b981' : '#f59e0b'}`, 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isResolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {isResolved ? 'حل شدہ (Resolved)' : 'پینڈنگ (Pending)'}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{item.description}</p>

                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      تاریخ: {new Date(item.created_at).toLocaleDateString('ur-PK')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}