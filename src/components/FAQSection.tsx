import { useState } from 'react';

const faqs = [
  { 
    question: 'How do I book an appointment?', 
    answer: 'You can easily book an appointment by clicking the "Book Appointment" button on our homepage. You will be prompted to select a department, choose a doctor, and pick an available time slot.' 
  },
  { 
    question: 'Do you offer emergency services?', 
    answer: 'Yes, our emergency department is open 24/7. We have specialized doctors and advanced life support ambulances ready round the clock to handle all medical emergencies.' 
  },
  { 
    question: 'What insurances do you accept?', 
    answer: 'We accept most major health insurance plans. Please contact our billing department or check our patient portal to verify if your specific insurance provider is covered.' 
  },
  { 
    question: 'Can I view my medical reports online?', 
    answer: 'Absolutely. You can log in to our secure Patient Portal using your registered phone number or ID to access your medical records, lab reports, and prescriptions.' 
  },
  { 
    question: 'Are online consultations available?', 
    answer: 'Yes, we offer telehealth services. You can schedule a video consultation with our specialists through the Patient Portal.' 
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{
          display: 'flex',
          gap: '4rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start'
        }}>
          
          {/* Text Side */}
          <div style={{ flex: '1 1 400px' }}>
            <span style={{
              color: 'var(--primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'block',
              marginBottom: '1rem'
            }}>FAQ</span>
            
            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              marginBottom: '1.5rem'
            }}>
              Frequently Asked <br/>Questions
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Have questions about our services, billing, or appointment process? Find quick answers to common queries below. If you need further assistance, our support team is always here to help.
            </p>
            
            <div style={{
              background: 'var(--card-bg)',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%', background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', fontSize: '1.2rem'
              }}>
                <i className="fas fa-headset"></i>
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Still have questions?</p>
                <h5 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Call us: +1 (800) 123-4567</h5>
              </div>
            </div>
          </div>

          {/* Accordion Side */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: isOpen ? 'var(--shadow-md)' : 'none'
                }}>
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <span style={{
                      fontWeight: 600,
                      fontSize: '1.05rem',
                      color: isOpen ? 'var(--primary)' : 'var(--text-primary)',
                      transition: 'color 0.2s'
                    }}>{faq.question}</span>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{
                      color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
                      transition: 'all 0.3s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                    }}></i>
                  </button>
                  
                  <div style={{
                    maxHeight: isOpen ? '200px' : '0',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    padding: isOpen ? '0 1.5rem 1.5rem' : '0 1.5rem'
                  }}>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      margin: 0
                    }}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
