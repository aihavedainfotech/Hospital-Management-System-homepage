import { useState, useEffect, useRef } from 'react';
import { fetchEvents, fetchAchievements } from '../api';

interface EventItem {
  id: number;
  title: string;
  description: string;
  datetime: string;
  category: 'Event' | 'News' | 'Achievement';
}

interface Achievement {
  id: number;
  title: string;
  value: string;
  icon?: string;
}

function EventModal({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const color = getCategoryColor(event.category);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#FFFFFF', borderRadius: '20px',
        border: `1px solid #E2E8F0`,
        boxShadow: '0 20px 60px rgba(15, 45, 82, 0.1)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: '#F8FFFE', border: 'none', borderRadius: '8px',
          width: '36px', height: '36px', fontSize: '1rem', cursor: 'pointer',
          color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          <i className="fas fa-times" />
        </button>
        <span style={{
          display: 'inline-block', marginBottom: '1rem',
          background: `${color}15`, color, border: `1px solid ${color}30`,
          borderRadius: '8px', padding: '4px 12px',
          fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{event.category}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F2D52', marginBottom: '0.75rem', paddingRight: '2rem' }}>
          {event.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-calendar" style={{ color: '#14B8A6' }} />
          {new Date(event.datetime).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' at '}
          {new Date(event.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem' }}>{event.description}</p>
        <button className="btn-primary" onClick={onClose} style={{ marginTop: '1.5rem', justifyContent: 'center', background: '#14B8A6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Event':       return '#14B8A6';
    case 'News':        return '#06B6D4';
    case 'Achievement': return '#14B8A6';
    default:            return '#06B6D4';
  }
}
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Event':       return 'fas fa-calendar-alt';
    case 'News':        return 'fas fa-newspaper';
    case 'Achievement': return 'fas fa-trophy';
    default:            return 'fas fa-bullhorn';
  }
}

function AnimCard({ children, delay = 0, direction = 'up' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add('visible'), delay); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={`fade-in-${direction}`}>{children}</div>;
}

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievementsData, setAchievementsData] = useState<Achievement[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [evData, achData] = await Promise.all([fetchEvents(), fetchAchievements()]);
        setEvents(evData);
        setAchievementsData(achData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const sorted = [...events].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  const byCategory = sorted.reduce((acc, ev) => {
    // Normalize category to Title Case (e.g. 'news' -> 'News')
    const cat = ev.category.charAt(0).toUpperCase() + ev.category.slice(1).toLowerCase();
    acc[cat] = acc[cat] || [];
    acc[cat].push({...ev, category: cat as EventItem['category']});
    return acc;
  }, {} as Record<string, EventItem[]>);

  return (
    <section id="events" className="section-pad" style={{
      background: 'var(--bg-primary)',
      position: 'relative', overflow: 'hidden', borderTop: '1px solid #E2E8F0'
    }}>
      <style>{`
        .ev-dot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(20, 184, 166,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .ev-card {
          background: #FFFFFF;
          border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(15, 45, 82, 0.12);
          box-shadow: 0 10px 30px rgba(15, 45, 82, 0.1);
          transition: all 0.2s ease; cursor: pointer; height: 100%;
        }
        .ev-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(20, 184, 166, 0.22);
          border-color: rgba(20, 184, 166, 0.35);
        }
        .ev-cat-pill {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 8px; padding: 6px 14px;
          font-size: 0.85rem; font-weight: 500; cursor: default;
        }
        .ach-card {
          background: #FFFFFF;
          border-radius: 16px; padding: 2rem; text-align: center;
          border: 1px solid rgba(15, 45, 82, 0.12);
          box-shadow: 0 10px 30px rgba(15, 45, 82, 0.1);
          transition: all 0.2s ease;
        }
        .ach-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(20, 184, 166, 0.22);
          border-color: rgba(20, 184, 166, 0.35);
        }
      `}</style>

      <div className="ev-dot-grid" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <AnimCard>
          <h2 className="section-title" style={{ color: '#0F2D52', textAlign: 'center' }}>Events, News & Achievements</h2>
          <div className="section-divider" style={{ margin: '12px auto 16px', background: '#14B8A6', width: '60px', height: '4px', borderRadius: '2px' }} />
          <p className="section-subtitle" style={{ color: '#64748B', textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Stay updated with our latest healthcare initiatives, community events, and medical achievements.
          </p>
        </AnimCard>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div className="skeleton" style={{ height: '12px', margin: '1.25rem', borderRadius: '6px' }} />
                <div className="skeleton" style={{ height: '14px', margin: '0 1.25rem 0.5rem', borderRadius: '6px', width: '60%' }} />
                <div className="skeleton" style={{ height: '60px', margin: '0 1.25rem 1.25rem' }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Category pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {Object.keys(byCategory).map(cat => (
                <div key={cat} className="ev-cat-pill" style={{
                  background: `${getCategoryColor(cat)}15`,
                  border: `1px solid ${getCategoryColor(cat)}30`,
                  color: getCategoryColor(cat),
                }}>
                  <i className={getCategoryIcon(cat)} />
                  {cat} ({byCategory[cat].length})
                </div>
              ))}
            </div>

            {/* Events grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
              {sorted.map((event, i) => {
                const color = getCategoryColor(event.category);
                return (
                  <AnimCard key={event.id} delay={i * 70} direction={i % 2 === 0 ? 'left' : 'right'}>
                    <div className="ev-card" onClick={() => setSelectedEvent(event)}>
                      {/* Card header */}
                      <div style={{
                        background: '#F8FFFE',
                        padding: '1rem 1.5rem',
                        borderBottom: `1px solid #E2E8F0`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: color
                          }}>
                            <i className={getCategoryIcon(event.category)} style={{ fontSize: '0.85rem' }} />
                          </div>
                          <span style={{ color: '#0F2D52', fontWeight: 600, fontSize: '0.85rem' }}>{event.category}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                          {new Date(event.datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      {/* Card body */}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '8px', lineHeight: 1.4 }}>
                          {event.title}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-clock" style={{ color }} />
                          {new Date(event.datetime).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, marginBottom: '16px' }}>
                          {event.description.length > 120 ? event.description.slice(0, 120) + '...' : event.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontWeight: 500, fontSize: '0.85rem' }}>
                          Read More <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                        </div>
                      </div>
                    </div>
                  </AnimCard>
                );
              })}
            </div>
          </>
        )}

        {/* Achievements */}
        <AnimCard>
          <h3 style={{ fontSize: '1.5rem', color: '#0F2D52', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>
            Our Achievements
          </h3>
          <div className="section-divider" style={{ margin: '0 auto 2rem', background: '#14B8A6', width: '60px', height: '4px', borderRadius: '2px' }} />
        </AnimCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {achievementsData.map((ach, i) => (
            <AnimCard key={ach.id} delay={i * 100} direction={i % 2 === 0 ? 'left' : 'right'}>
              <div className="ach-card">
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  background: '#F8FFFE', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <i className={ach.icon || 'fas fa-trophy'} style={{ fontSize: '1.4rem', color: '#14B8A6' }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#14B8A6', marginBottom: '4px' }}>{ach.value}</div>
                <h4 style={{ fontWeight: 500, color: '#0F2D52', fontSize: '0.95rem' }}>{ach.title}</h4>
              </div>
            </AnimCard>
          ))}
        </div>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </section>
  );
}
