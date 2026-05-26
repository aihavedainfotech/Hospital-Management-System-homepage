import { useState, useRef, useEffect } from 'react';
import apiClient from '../services/apiClient';

function useAnim(direction: 'up' | 'left' | 'right' = 'up', delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add('visible'), delay); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [delay]);
  return { ref, className: `fade-in-${direction}` };
}

const categories = ['All', 'Nutrition', 'Fitness', 'Mental Health', 'Sleep', 'Preventive Care', 'Heart Health', 'Diabetes'];

interface Habit {
  id: number;
  category: string;
  icon: string;
  color: string;
  title: string;
  summary: string;
  detail: string;
  tips: string[];
  frequency: string;
  difficulty: string;
}

const habits: Habit[] = [
  {
    id: 1, category: 'Nutrition', icon: 'fas fa-apple-alt', color: '#06B6D4',
    title: 'Hydrate Consistently', summary: 'Drink at least 8 glasses of water daily.',
    detail: 'Water is essential for every cell in your body. Consistent hydration improves skin health, digestion, and energy levels.',
    tips: ['Carry a reusable bottle', 'Set hourly reminders', 'Drink a glass before every meal'],
    frequency: 'Daily', difficulty: 'Easy'
  },
  {
    id: 2, category: 'Fitness', icon: 'fas fa-walking', color: '#14B8A6',
    title: 'Daily 30-Min Walk', summary: 'Maintain cardiovascular health with brisk walking.',
    detail: 'Walking is one of the most effective low-impact exercises. It strengthens the heart and reduces risk of chronic diseases.',
    tips: ['Walk during lunch breaks', 'Use stairs instead of elevators', 'Track steps with an app'],
    frequency: 'Daily', difficulty: 'Easy'
  }
];

const bmiCategories = [
  { range: '< 18.5', label: 'Underweight', color: '#3498db' },
  { range: '18.5 - 24.9', label: 'Normal', color: '#06B6D4' },
  { range: '25 - 29.9', label: 'Overweight', color: '#f39c12' },
  { range: '≥ 30', label: 'Obese', color: '#EF4444' },
];

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) setBmi(parseFloat((w / (h * h)).toFixed(1)));
  };

  const getBmiColor = (b: number) => {
    if (b < 18.5) return '#3498db';
    if (b < 25) return '#06B6D4';
    if (b < 30) return '#f39c12';
    return '#EF4444';
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '1.5rem',
      border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 45, 82, 0.05)',
      display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-calculator" style={{ color: '#14B8A6' }}></i>
        BMI Calculator
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (kg)"
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FFFE', fontSize: '0.9rem', outline: 'none' }} />
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="Height (cm)"
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FFFE', fontSize: '0.9rem', outline: 'none' }} />
      </div>
      <button onClick={calculate} style={{ background: '#14B8A6', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
        Calculate
      </button>
      {bmi !== null && (
        <div style={{ textAlign: 'center', marginTop: '1rem', background: '#F8FFFE', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: getBmiColor(bmi) }}>{bmi}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Your BMI</div>
        </div>
      )}
    </div>
  );
}

export default function HealthyHabitsPortal() {
  const head = useAnim('up');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [healthTip, setHealthTip] = useState("Walking for just 30 minutes a day can significantly improve your cardiovascular health and mood.");
  const [tipLoading, setTipLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/homepage/chatbot/health-tip')
      .then(r => {
        const d = r.data;
        if (d.success && d.tip) setHealthTip(d.tip);
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setTipLoading(false));
  }, []);

  const filtered = activeCategory === 'All' ? habits : habits.filter(h => h.category === activeCategory);

  return (
    <section id="healthy-habits" className="section-pad" style={{
      background: '#FFFFFF',
      position: 'relative', overflow: 'hidden',
      borderTop: '1px solid #E2E8F0'
    }}>
      <style>{`
        .hab-card {
          background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 1.5rem;
          transition: all 0.2s ease; cursor: pointer;
        }
        .hab-card:hover {
          transform: translateY(-4px); border-color: #14B8A6;
          box-shadow: 0 8px 24px rgba(15, 45, 82, 0.08);
        }
        .hab-chip {
          padding: 6px 14px; border-radius: 20px; border: 1px solid #E2E8F0;
          background: #F8FFFE; color: #64748B; font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .hab-chip.active {
          background: #14B8A6; color: white; border-color: #14B8A6;
        }
      `}</style>

      <div className="container">
        <div ref={head.ref} className={head.className} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title" style={{ color: '#0F2D52' }}>Healthy Habits</h2>
          <div className="section-divider" style={{ margin: '12px auto 16px', background: '#14B8A6', width: '60px', height: '4px', borderRadius: '2px' }} />
          <p className="section-subtitle" style={{ color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Empowering you to live better with expert-guided health tools and daily wellness habits.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <BMICalculator />
          
          <div style={{ background: '#F8FFFE', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-tint" style={{ color: '#3498db' }}></i>
              Water Tracker
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>Track your daily 8 glasses of water for optimal health.</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2E8F0' }}>
                  <i className="fas fa-tint" style={{ fontSize: '0.8rem' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #14B8A6, #06B6D4)', borderRadius: '16px', padding: '1.5rem', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-lightbulb"></i>
              Daily Health Tip
            </h3>
            {tipLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', opacity: 0.8 }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Loading today's tip...</span>
              </div>
            ) : (
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginTop: '1rem' }}>
                "{healthTip}"
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`hab-chip ${activeCategory === cat ? 'active' : ''}`}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((habit) => (
              <div key={habit.id} className="hab-card" onClick={() => setSelectedHabit(habit)}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${habit.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <i className={habit.icon} style={{ fontSize: '1.2rem', color: habit.color }}></i>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F2D52', marginBottom: '8px' }}>{habit.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>{habit.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
