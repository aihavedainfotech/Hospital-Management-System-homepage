import facilityImg from '../assets/hospital_facility.png';

export default function AboutSection() {
  return (
    <section id="about" style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          flexWrap: 'wrap'
        }}>
          
          {/* Image Side */}
          <div style={{ flex: '1 1 400px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-20px', left: '-20px',
              width: '100%', height: '100%',
              border: '2px solid var(--border-color)',
              borderRadius: '24px',
              zIndex: 0
            }}></div>
            <img 
              src={facilityImg} 
              alt="Hospital Facility" 
              style={{
                width: '100%',
                borderRadius: '24px',
                position: 'relative',
                zIndex: 1,
                boxShadow: 'var(--shadow-lg)'
              }} 
            />
            
            <div style={{
              position: 'absolute',
              bottom: '-30px', right: '-30px',
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '50px', height: '50px',
                borderRadius: '50%', background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontSize: '1.5rem'
              }}>
                <i className="fas fa-award"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>25+ Years</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Of Medical Excellence</p>
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div style={{ flex: '1 1 500px' }}>
            <span style={{
              color: 'var(--primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem',
              display: 'block',
              marginBottom: '1rem'
            }}>About Us</span>
            
            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              marginBottom: '1.5rem'
            }}>
              A Legacy of <br/><span style={{ color: 'var(--accent)' }}>Compassionate Care</span>
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              We are a modern, patient-centered healthcare facility dedicated to providing the highest quality medical services. Our team of world-renowned specialists and dedicated nursing staff work together to ensure you receive the best possible care.
            </p>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              From routine check-ups to complex surgical procedures, we combine cutting-edge technology with a warm, healing environment to support your journey to complete wellness.
            </p>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}></i>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Advanced Technology</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}></i>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>24/7 Emergency Care</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}></i>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Expert Specialists</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}></i>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Affordable Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
