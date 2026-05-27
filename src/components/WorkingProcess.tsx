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

        <div className="working-process-grid" style={{
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
            .working-process-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 2rem;
              position: relative;
            }
            .step-circle {
              width: 90px; height: 90px;
              border: 4px solid var(--bg-secondary);
            }
            .step-badge {
              width: 28px; height: 28px;
              font-size: 0.85rem;
            }
            .step-icon {
              font-size: 2rem;
            }
            .step-title {
              font-size: 1.2rem;
            }
            .step-desc {
              font-size: 0.95rem;
              display: block;
            }

            @media (max-width: 768px) {
              .working-process-grid {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                gap: 0.2rem !important;
                justify-content: space-between;
              }
              .working-process-step {
                min-width: 0;
                flex: 1;
                padding: 0 0.2rem !important;
              }
              .process-line {
                top: 25px !important;
                left: 10% !important;
                right: 10% !important;
                width: auto !important;
                display: block !important;
              }
              .step-circle {
                width: 45px !important;
                height: 45px !important;
                border-width: 2px !important;
                margin-bottom: 0.5rem !important;
              }
              .step-badge {
                width: 16px !important;
                height: 16px !important;
                font-size: 0.55rem !important;
              }
              .step-icon {
                font-size: 1rem !important;
              }
              .step-title {
                font-size: 0.6rem !important;
                margin-bottom: 0.3rem !important;
                word-wrap: break-word;
              }
              .step-desc {
                font-size: 0.5rem !important;
                line-height: 1.2 !important;
                display: none; /* Hide description on very small screens if needed, but user said text will be small, so let's show it */
              }
            }
          `}</style>

          {steps.map((step, index) => (
            <div key={index} className="working-process-step" style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              padding: '0 1rem'
            }}>
              <div className="step-circle" style={{
                borderRadius: '50%',
                background: 'var(--card-bg)',
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
                <div className="step-badge" style={{
                  position: 'absolute',
                  top: '0', right: '0',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {index + 1}
                </div>
                <i className={`${step.icon} step-icon`} style={{ color: 'var(--primary)' }}></i>
              </div>
              <h4 className="step-title" style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>{step.title}</h4>
              <p className="step-desc" style={{
                color: 'var(--text-secondary)',
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
