const steps = [
  { icon: 'fas fa-search', title: 'Find a Doctor', desc: 'Browse our directory of expert specialists and choose the right one for you.' },
  { icon: 'fas fa-calendar-check', title: 'Book Appointment', desc: 'Select a convenient time slot and book your visit instantly online.' },
  { icon: 'fas fa-user-md', title: 'Consultation', desc: 'Meet with your doctor for a comprehensive medical evaluation.' },
  { icon: 'fas fa-heartbeat', title: 'Get Treatment', desc: 'Receive your personalized care plan and start your journey to recovery.' },
];

export default function WorkingProcess() {
  return (
    <section id="process" style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <span style={{
            color: 'var(--primary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.85rem',
            display: 'block',
            marginBottom: '1rem'
          }}>Our Process</span>
          
          <h2 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '2.5rem',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}>
            How It Works
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
          position: 'relative'
        }}>
          {/* Connecting Line (hidden on small screens) */}
          <div className="process-line" style={{
            position: 'absolute',
            top: '45px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--border-color)',
            zIndex: 0
          }}></div>

          <style>{`
            @media (max-width: 768px) {
              .process-line { display: none; }
            }
          `}</style>

          {steps.map((step, index) => (
            <div key={index} style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              padding: '0 1rem'
            }}>
              <div style={{
                width: '90px', height: '90px',
                borderRadius: '50%',
                background: 'var(--card-bg)',
                border: '4px solid var(--bg-secondary)',
                boxShadow: 'var(--shadow-md)',
                margin: '0 auto 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.borderColor = 'var(--primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--bg-secondary)';
              }}
              >
                {/* Step Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '0', right: '0',
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {index + 1}
                </div>
                <i className={step.icon} style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
              </div>
              <h4 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>{step.title}</h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: 0
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
