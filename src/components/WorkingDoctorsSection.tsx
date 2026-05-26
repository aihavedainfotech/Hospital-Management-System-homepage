import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchDoctors, fetchDepartments, Doctor } from '../api';

interface Props { onBook: (doctor: Doctor) => void; }

const CARD_W = 290;
const CARD_H = 410;
const VISIBLE = 5;

const WorkingDoctorsSection: React.FC<Props> = ({ onBook }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Cardiology');
  const [specs, setSpecs] = useState<string[]>([]);
  const [centerIdx, setCenterIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [flippedIds, setFlippedIds] = useState<Set<string | number>>(new Set());
  const [hoveredButtonDocId, setHoveredButtonDocId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([fetchDoctors(), fetchDepartments()]).then(([doctorsRes, deptRes]) => {
      const data: Doctor[] = doctorsRes?.data ?? [];
      const deptNames: string[] = Array.isArray(deptRes)
        ? deptRes.map((d: any) => d.name).filter(Boolean)
        : [];
      setDoctors(data);
      setSpecs(deptNames);
      
      const defaultFilter = deptNames.includes('Cardiology')
        ? 'Cardiology'
        : (deptNames[0] || 'Cardiology');
      setActiveFilter(defaultFilter);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let list = doctors;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(d => 
        d.name?.toLowerCase().includes(query) ||
        d.specialization?.toLowerCase().includes(query) ||
        d.department?.toLowerCase().includes(query)
      );
    } else {
      list = list.filter(
        d => d.department?.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    setFiltered(list);
    setCenterIdx(0);
  }, [activeFilter, searchQuery, doctors]);


  const goTo = (i: number) => {
    if (filtered.length === 0) return;
    setCenterIdx(((i % filtered.length) + filtered.length) % filtered.length);
  };


  const toggleFlip = (doctorId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedIds(prev => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });
  };

  if (loading) return (
    <section id="doctors" style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--bg-primary)' }}>
      <div style={{
        width: 48, height: 48,
        border: '4px solid #14B8A6', borderTop: '4px solid transparent',
        borderRadius: '50%', animation: 'wds-spin 1s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: '#64748B' }}>Loading specialists...</p>
    </section>
  );

  const maxSlots = Math.min(VISIBLE, filtered.length);
  const actualHalf = Math.floor(maxSlots / 2);
  const slots = Array.from({ length: maxSlots }, (_, i) => {
    const offset = i - actualHalf;
    const idx = ((centerIdx + offset) % filtered.length + filtered.length) % filtered.length;
    return { offset, doctor: filtered[idx], idx };
  });

  return (
    <section id="doctors" style={{
      padding: '80px 0 70px',
      background: 'var(--bg-primary)',
      overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @keyframes wds-spin { to { transform: rotate(360deg); } }

        /* Background blobs */
        .wds-blob {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .wds-blob-1 {
          top: -100px; left: -100px; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(20, 184, 166,0.05) 0%, transparent 65%);
        }
        .wds-blob-2 {
          bottom: -80px; right: -80px; width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(43,191,156,0.05) 0%, transparent 65%);
        }

        /* Dot grid pattern */
        .wds-dotgrid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(rgba(20, 184, 166,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Filter chips */
        .wds-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 18px; border-radius: 50px;
          border: 1.5px solid rgba(20, 184, 166,0.2);
          background: #FFFFFF; backdrop-filter: blur(8px);
          color: #64748B; font-size: 12px; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(20, 184, 166,0.04);
          transition: all 0.22s ease;
        }
        .wds-chip:hover {
          border-color: #14B8A6; color: #14B8A6;
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 14px rgba(20, 184, 166,0.1);
        }
        .wds-chip.active {
          background: #14B8A6;
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 16px rgba(20, 184, 166,0.2);
        }

        /* Search Bar */
        .wds-search-container {
          max-width: 480px; margin: 0 auto 30px; position: relative;
        }
        .wds-search-input {
          width: 100%; padding: 14px 20px 14px 48px; border-radius: 50px;
          border: 1.5px solid rgba(20, 184, 166, 0.25);
          background: #FFFFFF; color: #0F2D52; font-size: 14px; font-weight: 500;
          box-shadow: 0 4px 20px rgba(20, 184, 166, 0.04);
          transition: all 0.26s ease;
        }
        .wds-search-input:focus {
          outline: none; border-color: #14B8A6;
          box-shadow: 0 6px 24px rgba(20, 184, 166, 0.12);
        }
        .wds-search-icon {
          position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
          color: #14B8A6; font-size: 16px; pointer-events: none;
        }
        .wds-search-clear {
          position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
          color: #94A3B8; font-size: 16px; cursor: pointer; border: none;
          background: transparent; padding: 0; display: flex; align-items: center;
          transition: color 0.2s ease;
        }
        .wds-search-clear:hover { color: #EF4444; }

        /* Card shell */
        .wds-card {
          position: absolute;
          width: ${CARD_W}px;
          border-radius: 20px;
          overflow: visible;
          cursor: pointer;
          user-select: none;
          transition:
            transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94),
            opacity   0.38s ease,
            box-shadow 0.28s ease;
        }

        .wds-card-inner {
          border-radius: 20px;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 8px 32px rgba(15, 45, 82, 0.08);
          transition: box-shadow 0.28s ease;
          position: relative;
        }

        .wds-card.is-center .wds-card-inner {
          box-shadow: 0 12px 40px rgba(20, 184, 166, 0.12);
          border-color: rgba(20, 184, 166, 0.2);
        }

        .wds-card.is-center:hover .wds-card-inner {
          box-shadow: 0 16px 50px rgba(20, 184, 166, 0.15);
        }

        /* Hero banner */
        .wds-hero {
          height: 140px;
          background: linear-gradient(135deg, #DFF5F2 0%, #EAF4FF 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        /* Circular avatar */
        .wds-avatar-ring {
          width: 84px; height: 84px;
          border-radius: 50%;
          border: 4px solid #FFFFFF;
          box-shadow: 0 4px 16px rgba(15, 45, 82, 0.1);
          overflow: hidden;
          background: #FFFFFF;
          position: relative; z-index: 2;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .wds-card:hover .wds-avatar-ring {
          transform: scale(1.05);
        }
        .wds-avatar-ring img { width: 100%; height: 100%; object-fit: cover; }
        .wds-avatar-icon {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }

        /* Experience badge */
        .wds-exp-badge {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          background: #14B8A6;
          color: #FFFFFF; padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.2);
        }

        /* Card body */
        .wds-body {
          padding: 20px;
          text-align: center;
        }
        .wds-name {
          margin: 0 0 4px;
          font-size: 1.1rem; font-weight: 600;
          color: #0F2D52;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .wds-spec {
          margin: 0 0 8px;
          font-size: 0.8rem; font-weight: 500;
          color: #14B8A6;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .wds-verified {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.75rem; font-weight: 500; color: #06B6D4;
          margin-bottom: 12px;
        }

        .wds-divider {
          width: 40px; height: 2px; border-radius: 2px; margin: 0 auto 12px;
          background: #E2E8F0;
        }

        .wds-meta {
          display: flex; flex-direction: column; gap: 6px;
          font-size: 0.8rem; color: #64748B;
          margin-bottom: 16px;
        }
        .wds-meta-row {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .wds-meta-icon {
          color: #14B8A6; font-size: 11px;
        }

        /* Book Now button */
        .wds-book-btn {
          width: 100%; padding: 10px;
          background: #14B8A6;
          color: #fff; border: none; border-radius: 8px;
          font-size: 0.9rem; font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.2);
          transition: all 0.2s ease;
        }
        .wds-book-btn:hover {
          background: #1f8ad1;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }

        .wds-view-btn {
          width: 100%; padding: 10px;
          background: transparent;
          color: #0F2D52; border: 1px solid #E2E8F0;
          border-radius: 8px; font-size: 0.9rem; font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.2s ease;
        }
        .wds-view-btn:hover {
          border-color: #14B8A6; color: #14B8A6;
          background: #F8FFFE;
        }

        /* Nav arrows */
        .wds-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px; border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 20;
          box-shadow: 0 4px 12px rgba(15, 45, 82, 0.05);
          color: #14B8A6; font-size: 14px;
          transition: all 0.2s ease;
        }
        .wds-arrow:hover {
          background: #F8FFFE;
          border-color: #14B8A6;
          color: #14B8A6;
        }

        /* Dots */
        .wds-dots { display: flex; gap: 8px; justify-content: center; margin-top: 40px; }
        .wds-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #E2E8F0; cursor: pointer;
          transition: all 0.2s ease;
        }
        .wds-dot:hover { background: #64748B; }
        .wds-dot.active {
          width: 24px; border-radius: 4px;
          background: #14B8A6;
        }

        /* Flip card */
        .wds-flip-container {
          width: 100%; height: 100%;
          perspective: 1000px;
        }
        .wds-flip-inner {
          position: relative;
          width: 100%; height: 100%;
          transition: transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }
        .wds-flip-inner.flipped {
          transform: rotateY(180deg);
        }
        .wds-flip-front, .wds-flip-back {
          position: absolute;
          width: 100%; height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          overflow: hidden;
        }
        .wds-flip-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #1a3a4a 0%, #0d2233 50%, #1a3a4a 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 36px 20px 20px;
          text-align: center;
          overflow: hidden;
        }
        /* Hide scrollbar for Chrome/Safari */
        .wds-desc-scroll::-webkit-scrollbar {
          display: none;
        }
        .wds-flip-btn {
          position: absolute;
          top: 10px; right: 10px;
          z-index: 10;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
          color: #14B8A6;
        }
        .wds-flip-btn:hover {
          background: #14B8A6;
          color: white;
          transform: scale(1.1);
        }
        .wds-flip-back-btn {
          position: absolute;
          top: 10px; right: 10px;
          z-index: 10;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          transition: all 0.2s ease;
        }
        .wds-flip-back-btn:hover {
          background: rgba(255,255,255,0.25);
          color: white;
        }
      `}</style>

      {/* Decorative */}
      <div className="wds-dotgrid" />
      <div className="wds-blob wds-blob-1" />
      <div className="wds-blob wds-blob-2" />

      {/* Header */}
      <div className="container" style={{ marginBottom: '52px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 className="section-title" style={{ color: '#0F2D52' }}>Meet Our Medical Experts</h2>
          <div className="section-divider" style={{ margin: '12px auto 16px', background: '#14B8A6', width: '60px', height: '4px', borderRadius: '2px' }} />
          <p className="section-subtitle" style={{ maxWidth: '520px', margin: '0 auto', color: '#64748B' }}>
            World-class specialists dedicated to your care.
          </p>
        </div>

        {/* Search Box */}
        <div className="wds-search-container">
          <i className="fas fa-search wds-search-icon" />
          <input
            type="text"
            className="wds-search-input"
            placeholder="Search doctors by name, specialization, or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="wds-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
              <i className="fas fa-times-circle" />
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <i className="fas fa-filter" style={{ color: '#14B8A6', fontSize: '14px', marginRight: '8px' }} />
          {specs.map((s, si) => (
            <button
              key={s}
              className={`wds-chip ${activeFilter === s && searchQuery === '' ? 'active' : ''}`}
              onClick={() => {
                setSearchQuery('');
                setActiveFilter(s);
              }}
            >
              <i className="fas fa-stethoscope" style={{ fontSize: '10px' }} />
              {s}
            </button>
          ))}
        </div>
      </div>


      {/* Carousel */}
      <div
        style={{ position: 'relative', height: `${CARD_H + 80}px`, perspective: '1200px' }}
        onMouseLeave={() => { setHoveredIdx(null); }}
      >
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#64748B', fontSize: '1rem', fontWeight: 500,
            padding: '20px', textAlign: 'center'
          }}>
            <i className="fas fa-user-md-slash" style={{ fontSize: '48px', color: '#CBD5E1', marginBottom: '16px' }} />
            <p>No specialists available in this department currently.</p>
          </div>
        ) : (
          <>
            <button className="wds-arrow" style={{ left: 'calc(50% - 420px)' }} onClick={() => goTo(centerIdx - 1)}>
              <i className="fas fa-chevron-left" />
            </button>

            {slots.map(({ offset, doctor, idx }) => {
              if (!doctor) return null;
              const isCenter = offset === 0;
              const absOff = Math.abs(offset);
              const isHovered = hoveredIdx === idx;
              const isFlipped = (isHovered && hoveredButtonDocId !== doctor.id) || flippedIds.has(doctor.id);

              const x = offset * (CARD_W * 0.76);
              const rotY = offset * -32;
              const scale = isCenter
                ? (isHovered ? 1.05 : 1.0)
                : (isHovered ? 1 - absOff * 0.05 : 1 - absOff * 0.1);
              const z = isCenter ? 90 : -absOff * 60;
              const opacity = isCenter ? 1 : 1 - absOff * 0.20;
              const ty = isHovered ? -8 : 0;
              const zIdx = VISIBLE - absOff + (isHovered ? 5 : 0);

              return (
                <div
                  key={`${doctor.id}-${offset}`}
                  className={`wds-card${isCenter ? ' is-center' : ''}`}
                  style={{
                    left: `calc(50% - ${CARD_W / 2}px)`,
                    top: '30px',
                    transform: `translateX(${x}px) translateY(${ty}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`,
                    opacity,
                    zIndex: zIdx,
                    height: `${CARD_H}px`,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => {
                    setHoveredIdx(null);
                    setFlippedIds(prev => {
                      const next = new Set(prev);
                      next.delete(doctor.id);
                      return next;
                    });
                  }}
                  onClick={() => isCenter
                    ? onBook(doctor)
                    : goTo(((centerIdx + offset) % filtered.length + filtered.length) % filtered.length)
                  }
                >
                  <div className="wds-flip-container">
                    <div className={`wds-flip-inner${isFlipped ? ' flipped' : ''}`}>
                      {/* FRONT FACE */}
                      <div className="wds-flip-front">
                        <div className="wds-card-inner" style={{ height: '100%' }}>
                          {/* Flip button — always visible */}
                          <button
                            className="wds-flip-btn"
                            onClick={e => toggleFlip(doctor.id, e)}
                            title="See doctor profile"
                          >
                            ↺
                          </button>
                          {/* Hero with avatar inside */}
                          <div className="wds-hero" style={{ position: 'relative' }}>
                            <div className="wds-exp-badge">{doctor.experience}+ Yrs</div>
                            {doctor.is_active === false && (
                              <div style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(255,255,255,0.7)', zIndex: 5, backdropFilter: 'blur(2px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{
                                  background: '#EF4444', color: '#fff', fontSize: '0.7rem',
                                  fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
                                }}>Unavailable</span>
                              </div>
                            )}
                            <div className="wds-avatar-ring" style={{ opacity: doctor.is_active === false ? 0.7 : 1 }}>
                              {doctor.photo
                                ? <img src={doctor.photo} alt={doctor.name} />
                                : <div className="wds-avatar-icon">
                                    <i className="fas fa-user-md" style={{ fontSize: '34px', color: '#06B6D4' }} />
                                  </div>
                              }
                            </div>
                          </div>

                          {/* Body */}
                          <div className="wds-body">
                            <p className="wds-name">
                              {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                            </p>
                            <p className="wds-spec">{doctor.specialization}</p>
                            {doctor.is_active !== false ? (
                              <div className="wds-verified">
                                <i className="fas fa-check-circle" />
                                Verified Specialist
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#EF4444', fontWeight: 500, marginBottom: '12px' }}>
                                <i className="fas fa-times-circle" />
                                Not Accepting Appointments
                              </div>
                            )}
                            <div className="wds-divider" />

                            <div className="wds-meta">
                              <div className="wds-meta-row">
                                <i className="fas fa-clock wds-meta-icon" />
                                <span>{doctor.timings}</span>
                              </div>
                              <div className="wds-meta-row">
                                <i className="fas fa-calendar-alt wds-meta-icon" />
                                <span>{doctor.available_days}</span>
                              </div>
                            </div>

                            {isCenter ? (
                              doctor.is_active === false ? (
                                <div style={{
                                  width: '100%', padding: '10px', borderRadius: '8px',
                                  background: '#F3F4F6', color: '#9CA3AF',
                                  fontSize: '0.9rem', fontWeight: 500, textAlign: 'center',
                                  border: '1px solid #E5E7EB',
                                }}
                                  onMouseEnter={() => setHoveredButtonDocId(doctor.id)}
                                  onMouseLeave={() => setHoveredButtonDocId(null)}
                                >
                                  <i className="fas fa-ban" style={{ marginRight: '6px' }} />
                                  Doctor Inactive
                                </div>
                              ) : (
                                <button
                                  className="wds-book-btn"
                                  onMouseEnter={() => setHoveredButtonDocId(doctor.id)}
                                  onMouseLeave={() => setHoveredButtonDocId(null)}
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={e => { e.stopPropagation(); onBook(doctor); }}
                                >
                                  <i className="fas fa-calendar-check" />
                                  Book Now
                                </button>
                              )
                            ) : (
                              <button
                                className="wds-view-btn"
                                onMouseEnter={() => setHoveredButtonDocId(doctor.id)}
                                onMouseLeave={() => setHoveredButtonDocId(null)}
                                onMouseDown={e => e.stopPropagation()}
                                onClick={e => { e.stopPropagation(); onBook(doctor); }}
                                style={{ opacity: doctor.is_active === false ? 0.5 : 1 }}
                              >
                                <i className="fas fa-eye" />
                                View Profile
                              </button>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* BACK FACE */}
                      <div className="wds-flip-back">
                        <button
                          className="wds-flip-back-btn"
                          onClick={e => toggleFlip(doctor.id, e)}
                          title="Flip back"
                        >
                          ↺
                        </button>

                        {/* Doctor avatar */}
                        <div style={{
                          width: 68, height: 68, borderRadius: '50%',
                          border: '3px solid rgba(20, 184, 166,0.7)',
                          overflow: 'hidden',
                          marginBottom: 10,
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #DFF5F2 0%, #EAF4FF 100%)',
                          boxShadow: '0 4px 16px rgba(20, 184, 166,0.25)',
                        }}>
                          {doctor.photo
                            ? <img src={doctor.photo} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-user-md" style={{ fontSize: '26px', color: '#06B6D4' }} />
                              </div>
                          }
                        </div>

                        {/* Name */}
                        <p style={{
                          color: '#ffffff', fontWeight: 700, fontSize: '0.95rem',
                          marginBottom: 2, letterSpacing: '0.02em', textAlign: 'center',
                        }}>
                          {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                        </p>
                        <p style={{
                          color: '#14B8A6', fontSize: '0.68rem', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
                          textAlign: 'center',
                        }}>
                          {doctor.specialization}
                        </p>
                        {/* Experience badge */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(20, 184, 166,0.15)', border: '1px solid rgba(20, 184, 166,0.3)',
                          borderRadius: 20, padding: '2px 10px', marginBottom: 10,
                        }}>
                          <i className="fas fa-clock" style={{ fontSize: '9px', color: '#06B6D4' }} />
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 500 }}>
                            {doctor.experience}+ Years Experience
                          </span>
                        </div>

                        {/* Decorative line */}
                        <div style={{ width: 36, height: 2, background: 'linear-gradient(90deg, #14B8A6, #06B6D4)', borderRadius: 2, marginBottom: 10, flexShrink: 0 }} />

                        {/* Scrollable description */}
                        <div style={{
                          flex: 1,
                          overflowY: 'auto',
                          width: '100%',
                          paddingRight: 2,
                          scrollbarWidth: 'none',       /* Firefox */
                          msOverflowStyle: 'none',      /* IE/Edge */
                        }}
                        className="wds-desc-scroll"
                        >
                          <p style={{
                            color: doctor.description ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.78rem',
                            lineHeight: 1.7,
                            fontStyle: 'italic',
                            fontFamily: 'Georgia, serif',
                            letterSpacing: '0.01em',
                            textAlign: 'center',
                            margin: 0,
                          }}>
                            {doctor.description || 'No description available yet.'}
                          </p>
                        </div>

                        {/* Book button on back */}
                        {isCenter && doctor.is_active !== false && (
                          <button
                            style={{
                              marginTop: 10, padding: '7px 18px',
                              background: 'linear-gradient(135deg, #14B8A6, #06B6D4)',
                              color: '#fff', border: 'none', borderRadius: 8,
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(20, 184, 166,0.3)',
                              flexShrink: 0,
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); onBook(doctor); }}
                          >
                            <i className="fas fa-calendar-check" style={{ marginRight: 6 }} />
                            Book Appointment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button className="wds-arrow" style={{ right: 'calc(50% - 420px)' }} onClick={() => goTo(centerIdx + 1)}>
              <i className="fas fa-chevron-right" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      <div className="wds-dots">
        {filtered.map((_, i) => (
          <div key={i} className={`wds-dot${i === centerIdx ? ' active' : ''}`} onClick={() => goTo(i)} />
        ))}
      </div>
    </section>
  );
};


export default WorkingDoctorsSection;
