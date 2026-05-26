import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { submitComplaint, submitSuggestion, submitCompliment, fetchDoctors } from '../api';

function useAnim(direction: 'up' | 'left' | 'right' = 'up', delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add('visible'), delay); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [delay]);
  return { ref, className: `fade-in-${direction}` };
}

type FormType = 'complaint' | 'suggestion' | 'compliment';

interface FormData {
  name: string; phone: string; email: string; type: FormType;
  department: string; visitDate: string; subject: string; message: string; anonymous: boolean;
}

const tabs = [
  { type: 'complaint'  as FormType, label: 'Complaint', icon: 'fas fa-exclamation-circle', color: '#EF4444', bg: '#F8FFFE'  },
  { type: 'suggestion' as FormType, label: 'Suggestion',    icon: 'fas fa-lightbulb',          color: '#06B6D4', bg: '#F8FFFE' },
  { type: 'compliment' as FormType, label: 'Compliment',    icon: 'fas fa-heart',              color: '#14B8A6', bg: '#F8FFFE'  },
];

export default function ComplaintSuggestion() {
  const head = useAnim('up');
  const [activeTab, setActiveTab] = useState<FormType>('complaint');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [refNum, setRefNum] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '', phone: '', email: '', type: 'complaint',
    department: '', visitDate: '', subject: '', message: '', anonymous: false,
  });

  useEffect(() => {
    fetchDoctors().then(r => {
      const docs = Array.isArray(r?.data ?? r) ? (r?.data ?? r) : [];
      setDepartments([...new Set(docs.map((d: any) => d.department).filter(Boolean))]);
    }).catch(console.error);
  }, []);

  const activeTabInfo = tabs.find(t => t.type === activeTab)!;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('Please enter your message.'); return; }
    if (!form.anonymous && !form.name.trim()) { toast.error('Please enter your name or check anonymous.'); return; }
    setLoading(true);
    try {
      const payload = { name: form.anonymous ? undefined : form.name, phone: form.phone, email: form.email, department: form.department, visit_date: form.visitDate, subject: form.subject, message: form.message, anonymous: form.anonymous };
      const fn = form.type === 'complaint' ? submitComplaint : form.type === 'suggestion' ? submitSuggestion : submitCompliment;
      const result = await fn(payload);
      setRefNum(result.data?.reference_number || result.reference || result.data?.id || '');
      setEmailSent(result.email_sent === true);
      setSubmittedEmail(form.email || '');
      setSubmitted(true);
      toast.success(result.message);
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmailSent(false);
    setSubmittedEmail('');
    setForm({ name: '', phone: '', email: '', type: activeTab, department: '', visitDate: '', subject: '', message: '', anonymous: false });
    setRefNum('');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1px solid #E2E8F0',
    borderRadius: '10px', background: '#F8FFFE',
    color: '#0F2D52', fontSize: '0.9rem',
    outline: 'none', transition: 'all 0.2s',
  };

  return (
    <section id="feedback" className="section-pad" style={{
      background: '#FFFFFF',
      position: 'relative', overflow: 'hidden',
      borderTop: '1px solid #E2E8F0'
    }}>
      <style>{`
        .cs-dot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(20, 184, 166,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .cs-info-card {
          background: #FFFFFF;
          border-radius: 16px; padding: 1.25rem;
          border: 1px solid #E2E8F0;
          display: flex; gap: 1rem; align-items: flex-start;
          box-shadow: 0 4px 12px rgba(15, 45, 82, 0.05);
          transition: all 0.2s ease;
        }
        .cs-info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 45, 82, 0.08);
          border-color: #14B8A6;
        }
        .cs-form-card {
          background: #FFFFFF;
          border-radius: 20px; padding: 2.5rem;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 45, 82, 0.08);
        }
        .cs-tab-btn {
          padding: 0.75rem; border-radius: 12px;
          font-size: 0.85rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all 0.2s ease; border: 1px solid #E2E8F0;
        }
        .cs-submit-btn {
          width: 100%; padding: 0.9rem; border-radius: 10px; border: none;
          font-weight: 600; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s ease;
        }
        .cs-submit-btn:hover { transform: translateY(-1px); opacity: 0.9; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500; color: #0F2D52; }
      `}</style>

      <div className="cs-dot-grid" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div ref={head.ref} className={head.className} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title" style={{ color: '#0F2D52' }}>Feedback & Suggestions</h2>
          <div className="section-divider" style={{ margin: '12px auto 16px', background: '#14B8A6', width: '60px', height: '4px', borderRadius: '2px' }} />
          <p className="section-subtitle" style={{ color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            We value your input. Help us improve our healthcare services by sharing your experience.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { icon: 'fas fa-shield-alt',  title: 'Confidential', desc: 'Secure and anonymous options available.', color: '#14B8A6' },
              { icon: 'fas fa-clock',        title: 'Fast Response',      desc: 'We review all feedback within 48 hours.',           color: '#06B6D4' },
              { icon: 'fas fa-chart-line',   title: 'Improvement',    desc: 'Your feedback drives better patient care.',          color: '#14B8A6' },
            ].map((item, i) => (
              <div key={i} className="cs-info-card">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: '#F8FFFE', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={item.icon} style={{ color: item.color, fontSize: '1.1rem' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            
            <div style={{ background: '#F8FFFE', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '1.25rem' }}>
                <i className="fas fa-tasks" style={{ color: '#14B8A6', marginRight: '8px' }} />
                How it works
              </h4>
              {['Submit feedback', 'Review & investigation', 'Resolution & followup'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: i < 2 ? '12px' : 0 }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#14B8A6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                  }}>{i + 1}</div>
                  <p style={{ fontSize: '0.85rem', color: '#0F2D52', margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cs-form-card">
            {!submitted ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '2rem' }}>
                  {tabs.map(tab => (
                    <button key={tab.type} className="cs-tab-btn"
                      onClick={() => { setActiveTab(tab.type); setForm(f => ({ ...f, type: tab.type })); }}
                      style={{
                        background: activeTab === tab.type ? tab.color : 'white',
                        color: activeTab === tab.type ? 'white' : '#64748B',
                        borderColor: activeTab === tab.type ? tab.color : '#E2E8F0',
                      }}>
                      <i className={tab.icon} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '1.5rem', padding: '12px',
                    background: '#F8FFFE', borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}>
                    <input type="checkbox" id="anonymous" name="anonymous" checked={form.anonymous} onChange={handleChange}
                      style={{ width: '18px', height: '18px', accentColor: '#14B8A6', cursor: 'pointer' }} />
                    <label htmlFor="anonymous" style={{ fontSize: '0.85rem', color: '#0F2D52', cursor: 'pointer', fontWeight: 500 }}>
                      Submit Anonymously
                    </label>
                  </div>

                  {!form.anonymous && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" style={inputStyle} required={!form.anonymous} />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
                      </div>
                    </div>
                  )}

                  {!form.anonymous && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Email Address</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" style={inputStyle} />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label>Department</label>
                      <select name="department" value={form.department} onChange={handleChange} style={inputStyle}>
                        <option value="">Select department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Visit</label>
                      <input name="visitDate" type="date" value={form.visitDate} onChange={handleChange} style={inputStyle} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Subject</label>
                    <input name="subject" value={form.subject} onChange={handleChange} required style={inputStyle} placeholder="Short summary" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label>Message</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={4} required
                      style={{ ...inputStyle, resize: 'none' }} placeholder="Tell us more..." />
                  </div>

                  <button type="submit" disabled={loading} className="cs-submit-btn" style={{
                    background: loading ? '#E2E8F0' : activeTabInfo.color,
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Submitting...' : `Submit ${activeTab}`}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  background: '#F8FFFE', border: `2px solid ${activeTabInfo.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem', fontSize: '2rem', color: activeTabInfo.color,
                }}>
                  <i className="fas fa-check" />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F2D52', marginBottom: '1rem' }}>
                  Thank You!
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Your feedback has been received. We appreciate your time.
                </p>
                <button onClick={handleReset} style={{ background: '#14B8A6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Submit Another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
