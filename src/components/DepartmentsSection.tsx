import { useEffect, useRef, useState } from 'react';
import { fetchActiveDepartments } from '../api';

interface Department {
  icon: string;
  name: string;
  desc: string;
  color: string;
}

function AnimatedCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => el.classList.add('visible'), delay);
        observer.unobserve(el);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className={`fade-in-up ${className}`}>{children}</div>;
}

export default function DepartmentsSection() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        // Fetch departments directly from the new active-departments endpoint
        const deptsData = await fetchActiveDepartments();

        // Icon mapping based on department name
        const iconMap: Record<string, string> = {
          'Cardiology': 'fas fa-heartbeat',
          'Neurology': 'fas fa-brain',
          'Pediatrics': 'fas fa-child',
          'Orthopedics': 'fas fa-bone',
          'Oncology': 'fas fa-ribbon',
          'Emergency': 'fas fa-ambulance',
          'Radiology': 'fas fa-x-ray',
          'General': 'fas fa-user-md',
          'Dental': 'fas fa-tooth',
          'Dermatology': 'fas fa-hand-holding-medical'
        };

        const rawDepts = deptsData.data || deptsData;
        const finalDepts = Array.isArray(rawDepts) ? rawDepts : [];

        // Map backend data to UI format
        const departmentsWithColors = finalDepts.map((dept: any, index: number) => ({
          icon: iconMap[dept.name] || 'fas fa-hospital',
          color: ['#14B8A6', '#06B6D4', '#0F766E', '#163B65', '#0F2D52'][index % 5],
          name: dept.name,
          desc: dept.description || `${dept.name} department with expert doctors and advanced facilities`
        }));

        setDepartments(departmentsWithColors);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);
  return (
    <section id="departments" className="section-pad" style={{ background: 'var(--bg-primary)' }}>
      <div className="container">
        <AnimatedCard>
          <h2 className="section-title">Our Departments & Services</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            State-of-the-art infrastructure backed by cutting-edge technology and compassionate professionals.
          </p>
        </AnimatedCard>

        {/* Departments Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 1rem' }}></div>
                <div className="skeleton" style={{ height: '16px', margin: '0.5rem 0', borderRadius: '6px' }}></div>
                <div className="skeleton" style={{ height: '12px', margin: '0.25rem 0', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ height: '12px', margin: '0.25rem 0', borderRadius: '4px', width: '80%' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
            {departments.map((dept, i) => (
              <AnimatedCard key={dept.name} delay={i * 60}>
                <div className="dept-card" style={{ height: '100%' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: `${dept.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                    border: `1px solid ${dept.color}20`
                  }}>
                    <i className={dept.icon} style={{ fontSize: '1.4rem', color: dept.color }}></i>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {dept.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {dept.desc}
                  </p>
                  <a href="#appointments" style={{ color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={e => { e.preventDefault(); document.querySelector('#appointments')?.scrollIntoView({ behavior: 'smooth' }); }}>
                    Learn More <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
