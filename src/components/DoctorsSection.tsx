import { useState, useEffect, useRef } from 'react';
import { Doctor, fetchDoctors } from '../api';

const qualifications = ['All Qualifications', 'MD', 'MS', 'DM', 'MBBS'];

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'exp-desc', label: 'Experience (High to Low)' },
  { value: 'exp-asc', label: 'Experience (Low to High)' },
  { value: 'rating-desc', label: 'Rating (High to Low)' },
  { value: 'name-asc', label: 'Name (A to Z)' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <i key={i} className={i <= Math.floor(rating) ? 'fas fa-star' : i - 0.5 <= rating ? 'fas fa-star-half-alt' : 'far fa-star'}
          style={{ fontSize: '0.65rem', color: 'var(--gold)' }}></i>
      ))}
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.2rem', fontWeight: 500 }}>{rating}</span>
    </div>
  );
}

// Helper to format doctor name safely
function formatDoctorName(name: string) {
  if (!name) return '';
  const cleanName = name.replace(/^(dr\.|dr)\s+/i, '');
  return `Dr. ${cleanName}`;
}

interface DoctorsSectionProps {
  onBook: (doctor?: Doctor) => void;
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => el.classList.add('visible'), delay); observer.unobserve(el); }
    }, { threshold: 0.05 });
    observer.observe(el); return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className="fade-in-up" style={{ height: '100%', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>{children}</div>;
}

const DoctorIconPlaceholder = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a2b4a 0%, #3d8c8c 100%)', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', opacity: 0.1, fontSize: '8rem', fontWeight: 900, color: 'white', transform: 'rotate(-15deg)', right: '-1rem', bottom: '-1rem' }}>
        <i className="fas fa-user-md"></i>
      </div>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(5px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', letterSpacing: '1px' }}>{initials}</span>
      </div>
      <div style={{ position: 'absolute', bottom: '1rem', left: '0', right: '0', textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
        Medical Specialist
      </div>
    </div>
  );
};

function DoctorProfileModal({ doctor, onClose, onBook }: { doctor: Doctor; onClose: () => void; onBook: (d: Doctor) => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <i className="fas fa-times"></i>
        </button>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '110px', height: '110px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, border: '3px solid var(--teal)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {doctor.photo ? (
              <img src={doctor.photo} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <DoctorIconPlaceholder name={doctor.name} />
            )}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
              {formatDoctorName(doctor.name)}
            </h2>
            <p style={{ color: 'var(--teal)', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>{doctor.specialization}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StarRating rating={doctor.rating} />
              {doctor.qualification && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>• {doctor.qualification}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
          {[
            { icon: 'fas fa-hospital', label: 'Department', value: doctor.department, color: 'var(--navy)' },
            { icon: 'fas fa-award', label: 'Experience', value: `${doctor.experience} Years`, color: 'var(--gold)' },
            { icon: 'fas fa-calendar-day', label: 'Available Days', value: doctor.available_days, color: 'var(--teal)' },
            { icon: 'fas fa-clock', label: 'Timings', value: doctor.timings, color: '#8e44ad' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '0.875rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
              <i className={item.icon} style={{ color: item.color, fontSize: '0.95rem', marginTop: '0.15rem', flexShrink: 0 }}></i>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{item.label}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.875rem' }}>
          <button className="btn-primary" onClick={() => { onBook(doctor); onClose(); }} style={{ flex: 1, justifyContent: 'center' }}>
            <i className="fas fa-calendar-check"></i>Book Appointment
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '50px', border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <i className="fas fa-times"></i>Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsSection({ onBook }: DoctorsSectionProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [expFilter, setExpFilter] = useState('All');
  const [qualFilter, setQualFilter] = useState('All Qualifications');
  const [availFilter, setAvailFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<string[]>(['All']);
  const scrollContainerRef1 = useRef<HTMLDivElement>(null);
  const scrollContainerRef2 = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch doctors from database
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const result = await fetchDoctors();
        const doctorsData = Array.isArray(result.data) ? result.data : [];
        setDoctors(doctorsData);
        setFiltered(doctorsData);

        // Extract unique departments
        const uniqueDepts = ['All', ...new Set(doctorsData.map(d => d.department).filter(Boolean))];
        setDepartmentsList(uniqueDepts);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctors([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    let result = [...doctors];

    // Search
    if (search.trim()) result = result.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase())
    );

    // Department filter
    if (deptFilter !== 'All') result = result.filter(d => d.department === deptFilter);

    // Experience filter
    if (expFilter === '5+') result = result.filter(d => d.experience >= 5);
    else if (expFilter === '10+') result = result.filter(d => d.experience >= 10);
    else if (expFilter === '15+') result = result.filter(d => d.experience >= 15);
    else if (expFilter === '20+') result = result.filter(d => d.experience >= 20);

    // Qualification filter
    if (qualFilter !== 'All Qualifications') {
      result = result.filter(d => d.qualification && d.qualification.includes(qualFilter));
    }

    // Availability filter
    if (availFilter === 'Today') {
      const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
      result = result.filter(d => d.available_days.includes(today) || d.available_days.includes('Mon-Sat') || d.available_days.includes('24/7'));
    } else if (availFilter === 'Weekend') {
      result = result.filter(d => d.available_days.includes('Sat') || d.available_days.includes('Mon-Sat'));
    }

    // Rating filter
    if (ratingFilter === '4+') result = result.filter(d => d.rating >= 4);
    else if (ratingFilter === '4.5+') result = result.filter(d => d.rating >= 4.5);
    else if (ratingFilter === '4.8+') result = result.filter(d => d.rating >= 4.8);

    // Sort
    if (sortBy === 'exp-desc') result.sort((a, b) => b.experience - a.experience);
    else if (sortBy === 'exp-asc') result.sort((a, b) => a.experience - b.experience);
    else if (sortBy === 'rating-desc') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));

    setFiltered(result);
  }, [search, deptFilter, expFilter, qualFilter, availFilter, ratingFilter, sortBy, doctors]);

  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); }
    }, { threshold: 0.1 });
    observer.observe(el); return () => observer.disconnect();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (isHovered || filtered.length === 0) return;

    const interval = setInterval(() => {
      [scrollContainerRef1.current, scrollContainerRef2.current].forEach(container => {
        if (container) {
          const { scrollLeft, scrollWidth, clientWidth } = container;
          const maxScroll = scrollWidth - clientWidth;

          if (scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            container.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isHovered, filtered.length]);

  // Center highlight scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target.querySelector('.doctor-card') as HTMLElement;
          if (card) {
            if (entry.isIntersecting) {
              card.style.transform = 'scale(1.05)';
              card.style.boxShadow = '0 10px 25px rgba(61, 140, 140, 0.25)';
              card.style.borderColor = 'var(--teal)';
              card.style.zIndex = '10';
            } else {
              card.style.transform = 'scale(1)';
              card.style.boxShadow = 'var(--shadow-sm)';
              card.style.borderColor = 'var(--border-color)';
              card.style.zIndex = '1';
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px -40% 0px -40%',
        threshold: 0
      }
    );

    const elements = document.querySelectorAll('.doctor-scroll-item');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [filtered, loading]);

  const scrollLeftBtn = () => {
    if (scrollContainerRef1.current) scrollContainerRef1.current.scrollBy({ left: -200, behavior: 'smooth' });
    if (scrollContainerRef2.current) scrollContainerRef2.current.scrollBy({ left: -200, behavior: 'smooth' });
  };
  const scrollRightBtn = () => {
    if (scrollContainerRef1.current) scrollContainerRef1.current.scrollBy({ left: 200, behavior: 'smooth' });
    if (scrollContainerRef2.current) scrollContainerRef2.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearch(''); setDeptFilter('All'); setExpFilter('All');
    setQualFilter('All Qualifications'); setAvailFilter('All');
    setRatingFilter('All'); setSortBy('default');
  };

  const activeFilterCount = [
    search, deptFilter !== 'All', expFilter !== 'All',
    qualFilter !== 'All Qualifications', availFilter !== 'All',
    ratingFilter !== 'All'
  ].filter(Boolean).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 1rem', border: '1.5px solid var(--border-color)',
    borderRadius: '10px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
  };

  const renderDoctor = (doc: Doctor, i: number) => (
    <div key={doc.id} className="doctor-scroll-item" style={{ flex: '0 0 auto', width: '180px', scrollSnapAlign: 'center', padding: '0.5rem 0' }}>
      <AnimatedCard delay={i * 60}>
        <div className="doctor-card" style={{ height: '100%', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div style={{ position: 'relative', height: '110px', overflow: 'hidden', background: 'var(--navy)', cursor: 'pointer' }}
            onClick={() => setSelectedDoctor(doc)}>
            {doc.photo ? (
              <img src={doc.photo}
                alt={doc.name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
            ) : (
              <DoctorIconPlaceholder name={doc.name} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }}></div>
            <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <i className="fas fa-star" style={{ color: 'var(--gold)', fontSize: '0.65rem' }}></i>
              {doc.rating}
            </div>
            <div style={{ position: 'absolute', bottom: '0.4rem', left: '0.5rem', right: '0.5rem' }}>
              <span style={{ fontSize: '0.55rem', background: 'var(--teal)', color: 'white', borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {doc.department}
              </span>
            </div>
          </div>
          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.1rem', lineHeight: 1.2 }}>
              {formatDoctorName(doc.name)}
            </h3>
            <p style={{ color: 'var(--teal)', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.3rem' }}>{doc.specialization}</p>

            <div style={{ marginBottom: '0.4rem', transform: 'scale(0.85)', transformOrigin: 'left center' }}>
              <StarRating rating={doc.rating} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.4rem' }}>
              {doc.qualification && (
                <span style={{ fontSize: '0.6rem', background: 'rgba(142,68,173,0.06)', color: '#8e44ad', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(142,68,173,0.1)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <i className="fas fa-graduation-cap" style={{ fontSize: '0.55rem' }}></i>
                  {doc.qualification}
                </span>
              )}
              <span style={{ fontSize: '0.6rem', background: 'rgba(200,169,81,0.06)', color: 'var(--gold)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(200,169,81,0.1)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <i className="fas fa-award" style={{ fontSize: '0.55rem' }}></i>
                {doc.experience}y
              </span>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <i className="fas fa-calendar-day" style={{ color: 'var(--teal)', width: '10px' }}></i>
                {doc.available_days}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                <i className="fas fa-clock" style={{ color: 'var(--teal)', width: '10px' }}></i>
                {doc.timings}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
              <button className="btn-primary" onClick={() => onBook(doc)}
                style={{ flex: 1.5, justifyContent: 'center', padding: '0.4rem', fontSize: '0.65rem', borderRadius: '6px' }}>
                <i className="fas fa-calendar-check" style={{ marginRight: '0.2rem' }}></i>Book
              </button>
              <button onClick={() => setSelectedDoctor(doc)} style={{
                flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1.5px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', fontWeight: 600, transition: 'all 0.2s'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--teal)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
                Profile
              </button>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );

  return (
    <section id="doctors" className="section-pad" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div ref={sectionRef} className="fade-in-up">
          <h2 className="section-title">Meet Our Expert Doctors</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">World-class specialists committed to providing the highest standard of care.</p>
        </div>

        {/* Search + toggle filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem' }}></i>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialization..."
              style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1.5px solid var(--border-color)',
            background: showFilters ? 'var(--teal)' : 'var(--card-bg)', color: showFilters ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
          }}>
            <i className="fas fa-sliders-h"></i>
            Filters {activeFilterCount > 0 && <span style={{ background: 'white', color: 'var(--teal)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{activeFilterCount}</span>}
          </button>
          <div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, width: 'auto', paddingRight: '2rem' }}>
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Expanded filters panel */}
        {showFilters && (
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <i className="fas fa-hospital" style={{ color: 'var(--teal)', marginRight: '0.35rem' }}></i>Department
                </label>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={inputStyle}>
                  {departmentsList.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <i className="fas fa-award" style={{ color: 'var(--gold)', marginRight: '0.35rem' }}></i>Experience
                </label>
                <select value={expFilter} onChange={e => setExpFilter(e.target.value)} style={inputStyle}>
                  <option value="All">All Experience</option>
                  <option value="5+">5+ Years</option>
                  <option value="10+">10+ Years</option>
                  <option value="15+">15+ Years</option>
                  <option value="20+">20+ Years</option>
                </select>
              </div>

              {/* Qualification */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <i className="fas fa-graduation-cap" style={{ color: '#8e44ad', marginRight: '0.35rem' }}></i>Qualification
                </label>
                <select value={qualFilter} onChange={e => setQualFilter(e.target.value)} style={inputStyle}>
                  {qualifications.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>

              {/* Availability */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <i className="fas fa-calendar-check" style={{ color: '#27ae60', marginRight: '0.35rem' }}></i>Availability
                </label>
                <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} style={inputStyle}>
                  <option value="All">All Days</option>
                  <option value="Today">Available Today</option>
                  <option value="Weekend">Weekends</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <i className="fas fa-star" style={{ color: 'var(--gold)', marginRight: '0.35rem' }}></i>Minimum Rating
                </label>
                <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={inputStyle}>
                  <option value="All">All Ratings</option>
                  <option value="4+">4.0+ Stars</option>
                  <option value="4.5+">4.5+ Stars</option>
                  <option value="4.8+">4.8+ Stars</option>
                </select>
              </div>

              {/* Clear button */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={clearAllFilters} style={{
                  width: '100%', padding: '0.65rem 1rem', background: 'rgba(231,76,60,0.08)', border: '1.5px solid rgba(231,76,60,0.3)',
                  borderRadius: '10px', color: '#e74c3c', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                }}>
                  <i className="fas fa-times-circle"></i>Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results count + active filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--teal)' }}>{filtered.length}</strong> of {doctors.length} doctors
          </span>
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {deptFilter !== 'All' && <span style={{ background: 'rgba(61,140,140,0.12)', color: 'var(--teal)', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>{deptFilter} ×</span>}
              {expFilter !== 'All' && <span style={{ background: 'rgba(200,169,81,0.12)', color: 'var(--gold)', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>{expFilter} yrs ×</span>}
              {availFilter !== 'All' && <span style={{ background: 'rgba(39,174,96,0.12)', color: '#27ae60', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>{availFilter} ×</span>}
            </div>
          )}
        </div>

        {/* Doctor Cards */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem' }}>
            <div className="horizontal-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ flex: '0 0 auto', width: '180px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', scrollSnapAlign: 'center', background: 'var(--card-bg)' }}>
                  <div className="skeleton" style={{ height: '110px' }}></div>
                  <div style={{ padding: '0.75rem' }}>
                    <div className="skeleton" style={{ height: '14px', marginBottom: '0.4rem' }}></div>
                    <div className="skeleton" style={{ height: '10px', width: '60%', marginBottom: '0.5rem' }}></div>
                    <div className="skeleton" style={{ height: '26px', borderRadius: '20px' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="horizontal-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i + 6} style={{ flex: '0 0 auto', width: '180px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', scrollSnapAlign: 'center', background: 'var(--card-bg)' }}>
                  <div className="skeleton" style={{ height: '110px' }}></div>
                  <div style={{ padding: '0.75rem' }}>
                    <div className="skeleton" style={{ height: '14px', marginBottom: '0.4rem' }}></div>
                    <div className="skeleton" style={{ height: '10px', width: '60%', marginBottom: '0.5rem' }}></div>
                    <div className="skeleton" style={{ height: '26px', borderRadius: '20px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <i className="fas fa-user-md" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.3 }}></i>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No doctors found matching your filters.</p>
            <button onClick={clearAllFilters} className="btn-primary" style={{ marginTop: '1rem' }}>
              <i className="fas fa-redo"></i>Clear Filters
            </button>
          </div>
        ) : (
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Left Scroll Button */}
            <button
              onClick={scrollLeftBtn}
              style={{ position: 'absolute', left: '-1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--card-bg)', color: 'var(--teal)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', opacity: 0.9, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <i className="fas fa-chevron-left" style={{ fontSize: '1.2rem' }}></i>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1.75rem' }}>
              <div ref={scrollContainerRef1} className="horizontal-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '1.5rem', padding: '0.5rem', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}>
                {filtered.slice(0, Math.ceil(filtered.length / 2)).map((doc, i) => renderDoctor(doc, i))}
              </div>
              <div ref={scrollContainerRef2} className="horizontal-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '1.5rem', padding: '0.5rem', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}>
                {filtered.slice(Math.ceil(filtered.length / 2)).map((doc, i) => renderDoctor(doc, i + Math.ceil(filtered.length / 2)))}
              </div>
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={scrollRightBtn}
              style={{ position: 'absolute', right: '-1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--card-bg)', color: 'var(--teal)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', opacity: 0.9, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <i className="fas fa-chevron-right" style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>
        )}
      </div>

      {selectedDoctor && (
        <DoctorProfileModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onBook={(d) => { onBook(d); setSelectedDoctor(null); }}
        />
      )}
    </section>
  );
}
