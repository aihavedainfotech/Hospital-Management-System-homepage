import React, { useEffect, useState } from 'react';
import { fetchActiveDepartments, fetchDoctors, Doctor } from '../api';

interface DeptData {
  name: string;
  sub: string;
  icon: React.ReactNode;
  desc: string;
}

const ALL_DEPTS: Record<string, DeptData> = {
  'Cardiology': {
    name: 'Cardiology', sub: 'Heart & Vascular',
    desc: 'Comprehensive heart care — diagnosis, treatment & prevention of cardiovascular diseases.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  },
  'Neurology': {
    name: 'Neurology', sub: 'Brain & Nervous System',
    desc: 'Advanced care for brain, spine, and nerve disorders by expert neurologists.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/></svg>
  },
  'Orthopedics': {
    name: 'Orthopedics', sub: 'Bones & Joints',
    desc: 'Surgical and non-surgical treatments for joint, bone, and muscle conditions.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2c-1.1 0-2 .9-2 2v2.5l-2 1.5V5c0-1.1-.9-2-2-2s-2 .9-2 2v3l-2-1.5V4c0-1.1-.9-2-2-2S4 2.9 4 4v5c0 2.2 1.8 4 4 4h.5L7 20c0 1.1.9 2 2 2s2-.9 2-2l-1-7h4l-1 7c0 1.1.9 2 2 2s2-.9 2-2l-1.5-7H17c2.2 0 4-1.8 4-4V4c0-1.1-.9-2-2-2z"/></svg>
  },
  'Women & Child Care': {
    name: 'Women & Child', sub: 'OB/GYN & Pediatrics',
    desc: 'Compassionate maternity, gynecology, and pediatric services for all ages.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 8v8"/><path d="M9 13h6"/><path d="M9 21h6"/><path d="M10 21v-4"/><path d="M14 21v-4"/></svg>
  },
  'Gastroenterology': {
    name: 'Gastroenterology', sub: 'Digestive Health',
    desc: 'Expert care for digestive tract, liver, and gastrointestinal disorders.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 3-2 5-3 7s-1 4-1 4H11s0-2-1-4-3-4-3-7a5 5 0 0 1 5-5z"/><path d="M10 17c0 2 .9 3.5 2 3.5s2-1.5 2-3.5"/></svg>
  },
  'Oncology': {
    name: 'Oncology', sub: 'Cancer Care',
    desc: 'State-of-the-art cancer diagnosis, treatment, and recovery care.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
  },
  'Ophthalmology': {
    name: 'Ophthalmology', sub: 'Eye Care',
    desc: 'Advanced eye care, vision correction, and surgical interventions.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  },
  'Pulmonology': {
    name: 'Pulmonology', sub: 'Lung & Respiratory',
    desc: 'Specialized treatment for respiratory and lung-related conditions.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16"/><path d="M8 8c-2 0-5 1-5 4s3 4 5 4h1V8z"/><path d="M16 8c2 0 5 1 5 4s-3 4-5 4h-1V8z"/><path d="M8 12h8"/></svg>
  },
  'Dentistry': {
    name: 'Dentistry', sub: 'Oral & Dental Health',
    desc: 'Comprehensive dental services, from routine checkups to oral surgery.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-1.2 5.4-3 7-3 10a3 3 0 0 0 6 0c0-3-1.8-4.6-3-10z"/><path d="M6.6 5.2A4.9 4.9 0 0 0 3 10c0 2.8 2.5 5 5 5"/><path d="M17.4 5.2A4.9 4.9 0 0 1 21 10c0 2.8-2.5 5-5 5"/></svg>
  },
  'Radiology': {
    name: 'Radiology', sub: 'Imaging & Diagnostics',
    desc: 'Precise diagnostic imaging using cutting-edge medical technology.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><circle cx="12" cy="10" r="3"/><path d="M12 7v1"/><path d="M12 12v1"/><path d="M9 10H8"/><path d="M16 10h-1"/></svg>
  }
};

export default function DepartmentsSection({ onBook }: { onBook: (doctor: Doctor) => void }) {
  const [selectedDept, setSelectedDept] = useState<string>('Cardiology');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      try {
        const docData = await fetchDoctors();
        const docs = Array.isArray(docData) ? docData : (docData.data || []);
        // Match API department to HTML department name (or fallback if it just matches substring)
        setDoctors(docs);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadDoctors();
  }, []);

  const currentDeptData = ALL_DEPTS[selectedDept] || { name: selectedDept, sub: 'Specialty', desc: 'Expert medical care.' };
  
  // Filter doctors that belong to selectedDept (API gives things like 'Cardiology', so match substring)
  const filteredDoctors = doctors.filter(d => {
    if (selectedDept === 'Women & Child Care') return d.department.includes('Pediatric') || d.department.includes('Gyne');
    return d.department.toLowerCase().includes(selectedDept.toLowerCase());
  });

  const activeDeptsKeys = Object.keys(ALL_DEPTS).filter(deptKey => 
    doctors.some(d => {
      if (deptKey === 'Women & Child Care') return d.department.includes('Pediatric') || d.department.includes('Gyne');
      return d.department.toLowerCase().includes(deptKey.toLowerCase());
    })
  );

  useEffect(() => {
    if (activeDeptsKeys.length > 0 && !activeDeptsKeys.includes(selectedDept)) {
      setSelectedDept(activeDeptsKeys[0]);
    }
  }, [activeDeptsKeys, selectedDept]);

  const getDoctorTheme = (name: string) => {
    const n = name.toLowerCase();
    const isFemale = /\b(sarah|priya|neha|anjali|riya|women|mrs|miss|dr\.?\s*s|dr\.?\s*p|aisha)\b/i.test(n) || n.split(' ')[0].endsWith('a') || n.split(' ')[0].endsWith('i');
    return isFemale 
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/dr\.?\s*/i, ''))}&background=fdf4ff&color=c026d3&size=256&font-size=0.4`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/dr\.?\s*/i, ''))}&background=f0f9ff&color=0284c7&size=256&font-size=0.4`;
  };

  return (
    <section id="departments" style={{ padding: '36px 5%', background: '#f0fdfa' }}>
      <div className="text-center" style={{ marginBottom: '28px' }}>
        <div className="section-tag">Departments &amp; Specialists</div>
        <div className="section-h2">Find the Right Doctor</div>
        <p className="section-p" style={{ margin: '0 auto' }}>Select a department to explore our expert specialists. Book your appointment in seconds.</p>
      </div>

      <div className="dd-main-layout">
        {/* LEFT TAB COLUMN */}
        <div className="dd-dept-col">
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f766e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>Departments</div>
          
          {activeDeptsKeys.map(deptKey => {
            const isActive = selectedDept === deptKey;
            return (
              <div key={deptKey} className={`dd-tab ${isActive ? 'active' : ''}`} onClick={() => setSelectedDept(deptKey)}>
                <span className="dd-tab-icon">{ALL_DEPTS[deptKey].icon}</span>
                <div className="dd-tab-info">
                  <div className="dd-tab-name">{ALL_DEPTS[deptKey].name}</div>
                  <div className="dd-tab-sub">{ALL_DEPTS[deptKey].sub}</div>
                </div>
                <span className="dd-tab-arrow">›</span>
              </div>
            );
          })}
        </div>

        {/* RIGHT DOCTORS PANEL */}
        <div className="dd-doctors-col">
          <div id="dd-dept-banner" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <div id="dd-banner-icon" style={{ fontSize: '1.6rem', flexShrink: 0 }}>❤️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div id="dd-banner-name" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>{currentDeptData.name}</div>
              <div id="dd-banner-desc" style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentDeptData.desc}</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center', flexShrink: 0 }}>
              <div id="dd-banner-count" style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}>{filteredDoctors.length}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '1px' }}>Specialists</div>
            </div>
          </div>

          <div id="dd-doctors-grid" className="dd-doctors-grid">
            {loading && <p>Loading doctors...</p>}
            {!loading && filteredDoctors.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>No specialists found for {currentDeptData.name} at this time.</p>}
            {!loading && filteredDoctors.map(doc => (
              <div className="dd-doc-card" key={doc.id}>
                <div className="dd-doc-avatar" style={{ background: '#e2e8f0' }}>
                  <img src={doc.photo || getDoctorTheme(doc.name)} alt={doc.name} onError={(e) => { e.currentTarget.src = getDoctorTheme(doc.name) }} />
                  <div className={`dd-doc-badge ${doc.is_active !== false ? 'avail-green' : 'avail-amber'}`}>{doc.is_active !== false ? 'Available' : 'Unavailable'}</div>
                </div>
                <div className="dd-doc-body">
                  <div className="dd-doc-name">{doc.name}</div>
                  <div className="dd-doc-spec">{doc.department}</div>
                  <div className="dd-doc-exp">{doc.experience} Years Experience</div>
                  <div className="dd-doc-rating">
                    ⭐⭐⭐⭐⭐ <span>{doc.rating} ({Math.floor(Math.random() * 200) + 50} reviews)</span>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', padding: '6px 10px', background: '#f0fdfa', borderRadius: '6px', color: '#0f766e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', border: '1px solid #ccfbf1' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {doc.available_days || 'Mon-Sat'}
                    </span>
                    <span style={{ color: '#99f6e4' }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {doc.timings || '09:00 AM - 05:00 PM'}
                    </span>
                  </div>

                  <button className="dd-doc-btn" onClick={() => onBook(doc)}>Book Appointment</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
