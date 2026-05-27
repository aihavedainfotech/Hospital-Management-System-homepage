import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { submitComplaint, submitSuggestion, submitCompliment, fetchDoctors } from '../api';

type FormType = 'complaint' | 'suggestion' | 'compliment';

interface FormData {
  name: string; phone: string; email: string; type: FormType;
  department: string; visitDate: string; subject: string; message: string; anonymous: boolean;
}

const tabs = [
  { type: 'complaint'  as FormType, label: 'Complaint',   icon: 'fas fa-exclamation-circle', color: '#EF4444', grad: 'linear-gradient(135deg,#EF4444,#DC2626)', light: '#FEF2F2' },
  { type: 'suggestion' as FormType, label: 'Suggestion',  icon: 'fas fa-lightbulb',          color: '#0EA5E9', grad: 'linear-gradient(135deg,#0EA5E9,#0284C7)', light: '#F0F9FF' },
  { type: 'compliment' as FormType, label: 'Compliment',  icon: 'fas fa-heart',              color: '#14B8A6', grad: 'linear-gradient(135deg,#14B8A6,#0F766E)', light: '#F0FDFA' },
];

interface Props { onClose?: () => void; }

export default function ComplaintSuggestion({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<FormType>('complaint');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [refNum, setRefNum]       = useState('');
  const formRef = useRef<HTMLFormElement>(null);

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
      setSubmitted(true);
      toast.success(result.message);
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setSubmitted(false); setRefNum('');
    setForm({ name: '', phone: '', email: '', type: activeTab, department: '', visitDate: '', subject: '', message: '', anonymous: false });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .csm-wrap {
          display: flex; flex-direction: column;
          height: 100%; font-family: 'Poppins', sans-serif;
          background: #fff; border-radius: 20px; overflow: hidden;
        }

        /* ── HEADER ── */
        .csm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px;
          background: linear-gradient(135deg, #0F2D52 0%, #1a4a7a 100%);
          flex-shrink: 0;
        }
        .csm-header-left { display: flex; align-items: center; gap: 12px; }
        .csm-header-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: #14B8A6;
        }
        .csm-header-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
        .csm-header-sub   { font-size: 0.7rem; color: rgba(255,255,255,0.6); margin: 2px 0 0; }
        .csm-close {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; transition: all 0.2s;
        }
        .csm-close:hover { background: #EF4444; border-color: #EF4444; color: #fff; }

        /* ── BODY ── */
        .csm-body { display: flex; flex: 1; overflow: hidden; }

        /* ── SIDEBAR ── */
        .csm-sidebar {
          width: 190px; flex-shrink: 0;
          background: linear-gradient(180deg, #F0FDFA 0%, #E0F7FA 100%);
          border-right: 1px solid #E2E8F0;
          padding: 16px 12px; display: flex; flex-direction: column; gap: 8px;
          overflow-y: auto;
        }
        .csm-sb-card {
          background: #fff; border-radius: 12px; padding: 10px;
          border: 1px solid #E2E8F0; display: flex; gap: 9px; align-items: flex-start;
          box-shadow: 0 2px 8px rgba(15,45,82,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .csm-sb-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(15,45,82,0.1); }
        .csm-sb-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
        }
        .csm-sb-title { font-size: 0.75rem; font-weight: 700; color: #0F2D52; }
        .csm-sb-desc  { font-size: 0.65rem; color: #64748B; line-height: 1.4; }
        .csm-how {
          margin-top: 4px; background: #fff; border-radius: 12px;
          padding: 10px 12px; border: 1px solid #E2E8F0;
          box-shadow: 0 2px 8px rgba(15,45,82,0.05);
        }
        .csm-how-title { font-size: 0.72rem; font-weight: 700; color: #0F2D52; margin-bottom: 8px; }
        .csm-step { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .csm-step-dot {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,#14B8A6,#0F766E);
          color: #fff; font-size: 0.6rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(20,184,166,0.35);
        }
        .csm-step-text { font-size: 0.68rem; color: #0F2D52; font-weight: 500; }

        /* ── FORM AREA ── */
        .csm-form-area {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
        }
        .csm-form-scroll { flex: 1; overflow-y: auto; padding: 14px 18px 0; }

        /* Tabs */
        .csm-tabs { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-bottom: 12px; }
        .csm-tab {
          padding: 8px 4px; border-radius: 10px; border: 1.5px solid #E2E8F0;
          font-size: 0.72rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          background: #fff; color: #94A3B8;
          transition: all 0.22s;
        }
        .csm-tab:hover { border-color: #14B8A6; color: #14B8A6; }
        .csm-tab.active { color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(0,0,0,0.18); }

        /* Anon row */
        .csm-anon {
          display: flex; align-items: center; gap: 9px;
          background: #F8FFFE; border: 1.5px solid #E0F7FA;
          border-radius: 9px; padding: 8px 12px; margin-bottom: 10px; cursor: pointer;
        }
        .csm-anon-check {
          width: 16px; height: 16px; accent-color: #14B8A6; cursor: pointer; flex-shrink: 0;
        }
        .csm-anon-label { font-size: 0.76rem; font-weight: 600; color: #0F2D52; cursor: pointer; }

        /* Field groups */
        .csm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .csm-field { margin-bottom: 10px; }
        .csm-label {
          display: block; font-size: 0.72rem; font-weight: 600;
          color: #0F2D52; margin-bottom: 4px;
          display: flex; align-items: center; gap: 5px;
        }
        .csm-label i { font-size: 0.65rem; color: #14B8A6; }
        .csm-input {
          width: 100%; padding: 8px 11px; box-sizing: border-box;
          border: 1.5px solid #E2E8F0; border-radius: 9px;
          background: #F8FFFE; color: #0F2D52;
          font-size: 0.8rem; font-family: 'Poppins', sans-serif;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .csm-input:focus { border-color: #14B8A6; box-shadow: 0 0 0 3px rgba(20,184,166,0.12); background: #fff; }
        .csm-input::placeholder { color: #CBD5E1; }
        select.csm-input { cursor: pointer; }
        textarea.csm-input { resize: none; min-height: 68px; }

        /* ── FOOTER ── */
        .csm-footer {
          padding: 12px 18px;
          background: #fff;
          border-top: 1px solid #F1F5F9;
          flex-shrink: 0;
        }
        .csm-submit {
          width: 100%; padding: 11px; border: none; border-radius: 11px;
          font-size: 0.88rem; font-weight: 700; cursor: pointer; letter-spacing: 0.3px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: #fff; transition: opacity 0.2s, transform 0.2s;
        }
        .csm-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .csm-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Success */
        .csm-success {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 1.5rem; text-align: center;
        }
        .csm-success-ring {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem; color: #fff; margin-bottom: 1rem;
          box-shadow: 0 8px 24px rgba(20,184,166,0.35);
          animation: csm-pop 0.4s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes csm-pop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .csm-success h3 { font-size: 1.25rem; font-weight: 700; color: #0F2D52; margin: 0 0 6px; }
        .csm-success p  { font-size: 0.8rem; color: #64748B; margin: 0 0 1.2rem; line-height: 1.6; }
        .csm-ref {
          background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 9px;
          padding: 8px 16px; font-size: 0.75rem; color: #0F766E; font-weight: 600;
          margin-bottom: 1.2rem; letter-spacing: 0.5px;
        }
        .csm-success-btns { display: flex; gap: 10px; }
        .csm-btn-outline {
          padding: 9px 20px; border-radius: 9px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid #E2E8F0; background: #fff; color: #64748B;
          transition: all 0.2s;
        }
        .csm-btn-outline:hover { border-color: #14B8A6; color: #14B8A6; }
        .csm-btn-solid {
          padding: 9px 20px; border-radius: 9px; font-size: 0.8rem; font-weight: 700;
          cursor: pointer; border: none; color: #fff;
          background: linear-gradient(135deg,#14B8A6,#0F766E);
          box-shadow: 0 4px 12px rgba(20,184,166,0.3); transition: all 0.2s;
        }
        .csm-btn-solid:hover { opacity: 0.9; transform: translateY(-1px); }

        /* scrollbar */
        .csm-form-scroll::-webkit-scrollbar,
        .csm-sidebar::-webkit-scrollbar { width: 4px; }
        .csm-form-scroll::-webkit-scrollbar-thumb,
        .csm-sidebar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
      `}</style>

      <div className="csm-wrap">

        {/* ── Header ── */}
        <div className="csm-header">
          <div className="csm-header-left">
            <div className="csm-header-icon">
              <i className="fas fa-comment-medical" />
            </div>
            <div>
              <p className="csm-header-title">Feedback &amp; Suggestions</p>
              <p className="csm-header-sub">Your voice shapes better healthcare</p>
            </div>
          </div>
          {onClose && (
            <button className="csm-close" onClick={onClose} aria-label="Close">
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="csm-body">



          {/* Form */}
          <div className="csm-form-area">
            {!submitted ? (
              <>
                <div className="csm-form-scroll">
                  {/* Tabs */}
                  <div className="csm-tabs">
                    {tabs.map(tab => (
                      <button key={tab.type} type="button"
                        className={`csm-tab${activeTab === tab.type ? ' active' : ''}`}
                        onClick={() => { setActiveTab(tab.type); setForm(f => ({ ...f, type: tab.type })); }}
                        style={activeTab === tab.type ? { background: tab.grad } : {}}>
                        <i className={tab.icon} /> {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Anonymous */}
                  <label className="csm-anon">
                    <input type="checkbox" name="anonymous" checked={form.anonymous}
                      onChange={handleChange} className="csm-anon-check" />
                    <i className="fas fa-user-secret" style={{ color: '#14B8A6', fontSize: '0.85rem' }} />
                    <span className="csm-anon-label">Submit Anonymously</span>
                  </label>

                  <form ref={formRef} onSubmit={handleSubmit}>
                    {/* Name + Phone */}
                    {!form.anonymous && (
                      <div className="csm-row">
                        <div>
                          <label className="csm-label"><i className="fas fa-user" /> Full Name</label>
                          <input name="name" value={form.name} onChange={handleChange}
                            placeholder="John Doe" className="csm-input" required={!form.anonymous} />
                        </div>
                        <div>
                          <label className="csm-label"><i className="fas fa-phone" /> Phone</label>
                          <input name="phone" value={form.phone} onChange={handleChange}
                            placeholder="+91 XXXXX XXXXX" className="csm-input" />
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {!form.anonymous && (
                      <div className="csm-field">
                        <label className="csm-label"><i className="fas fa-envelope" /> Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="email@example.com" className="csm-input" />
                      </div>
                    )}

                    {/* Dept + Date */}
                    <div className="csm-row">
                      <div>
                        <label className="csm-label"><i className="fas fa-hospital" /> Department</label>
                        <select name="department" value={form.department} onChange={handleChange} className="csm-input">
                          <option value="">Select department</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="csm-label"><i className="fas fa-calendar" /> Date of Visit</label>
                        <input name="visitDate" type="date" value={form.visitDate} onChange={handleChange} className="csm-input" />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="csm-field">
                      <label className="csm-label"><i className="fas fa-tag" /> Subject</label>
                      <input name="subject" value={form.subject} onChange={handleChange}
                        placeholder="Brief summary of your feedback" className="csm-input" required />
                    </div>

                    {/* Message */}
                    <div className="csm-field">
                      <label className="csm-label"><i className="fas fa-comment-dots" /> Message</label>
                      <textarea name="message" value={form.message} onChange={handleChange}
                        rows={3} required className="csm-input"
                        placeholder="Describe your experience in detail..." />
                    </div>
                  </form>
                </div>

                {/* Submit footer */}
                <div className="csm-footer">
                  <button className="csm-submit" disabled={loading}
                    style={{ background: loading ? '#E2E8F0' : activeTabInfo.grad, color: loading ? '#94A3B8' : '#fff' }}
                    onClick={() => formRef.current?.requestSubmit()}>
                    {loading
                      ? <><i className="fas fa-spinner fa-spin" /> Submitting...</>
                      : <><i className={activeTabInfo.icon} /> Submit {activeTabInfo.label}</>}
                  </button>
                </div>
              </>
            ) : (
              <div className="csm-success">
                <div className="csm-success-ring" style={{ background: activeTabInfo.grad }}>
                  <i className="fas fa-check" />
                </div>
                <h3>Thank You!</h3>
                {refNum && <div className="csm-ref">🎫 Reference: {refNum}</div>}
                <p>Your {activeTab} has been received.<br />Our team will respond within 48 hours.</p>
                <div className="csm-success-btns">
                  <button className="csm-btn-solid" onClick={handleReset}>
                    <i className="fas fa-plus" style={{ marginRight: 6 }} /> Submit Another
                  </button>
                  {onClose && (
                    <button className="csm-btn-outline" onClick={onClose}>
                      <i className="fas fa-times" style={{ marginRight: 6 }} /> Close
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
