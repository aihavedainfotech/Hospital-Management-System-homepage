const services = [
  { icon: 'fas fa-heartbeat', title: 'Cardiology', desc: 'Expert care for your heart with state-of-the-art diagnostics and treatments.' },
  { icon: 'fas fa-brain', title: 'Neurology', desc: 'Comprehensive care for neurological disorders by top specialists.' },
  { icon: 'fas fa-bone', title: 'Orthopedics', desc: 'Advanced surgical and non-surgical solutions for bone and joint health.' },
  { icon: 'fas fa-baby', title: 'Pediatrics', desc: 'Compassionate, expert medical care tailored specifically for children.' },
  { icon: 'fas fa-tooth', title: 'Dental Care', desc: 'Complete dental services from routine checkups to complex surgeries.' },
  { icon: 'fas fa-eye', title: 'Ophthalmology', desc: 'Specialized eye care to protect and enhance your vision.' },
];

export default function ServicesSection() {
  return (
    <section id="services" style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: '700px', margin: '0 auto 4rem' }}>
          <span style={{
            color: 'var(--primary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.85rem',
            display: 'block',
            marginBottom: '1rem'
          }}>Our Services</span>
          
          <h2 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '2.5rem',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: '1rem'
          }}>
            High-Quality Services for <br/>Your Health
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            We provide a wide range of medical services designed to meet all your healthcare needs under one roof.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {services.map((service, index) => (
            <div key={index} style={{
              background: 'var(--card-bg)',
              borderRadius: '20px',
              padding: '2rem',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
              const iconBox = e.currentTarget.querySelector('.service-icon-box') as HTMLDivElement;
              if(iconBox) iconBox.style.background = 'var(--primary)';
              const icon = e.currentTarget.querySelector('.service-icon') as HTMLElement;
              if(icon) icon.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'none';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
              const iconBox = e.currentTarget.querySelector('.service-icon-box') as HTMLDivElement;
              if(iconBox) iconBox.style.background = 'var(--primary-light)';
              const icon = e.currentTarget.querySelector('.service-icon') as HTMLElement;
              if(icon) icon.style.color = 'var(--primary)';
            }}
            >
              <div className="service-icon-box" style={{
                width: '64px', height: '64px',
                borderRadius: '16px',
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem',
                transition: 'all 0.3s ease'
              }}>
                <i className={`service-icon ${service.icon}`} style={{ fontSize: '1.8rem', color: 'var(--primary)', transition: 'color 0.3s' }}></i>
              </div>
              <h4 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>{service.title}</h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: 0
              }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
