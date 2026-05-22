import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { AppProvider } from './context/AppContext';
import IntroAnimation from './components/IntroAnimation';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import WorkingDoctorsSection from './components/WorkingDoctorsSection';
import AppointmentSection from './components/AppointmentSection';
import EventsSection from './components/EventsSection';
import TestimonialsSection from './components/TestimonialsSection';
import PatientPortal from './components/PatientPortal';
import AmbulanceService from './components/AmbulanceService';
import ComplaintSuggestion from './components/ComplaintSuggestion';
import Footer, {
  BackToTop,
  ProgressBar,
} from './components/FooterAndMisc';
import ChatBot from './components/ChatBot';
import AboutSection from './components/AboutSection';
import WorkingProcess from './components/WorkingProcess';
import { Doctor, fetchTicker } from './api';
import { useEffect } from 'react';

function NewsTicker() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchTicker().then((data: any) => {
      if (Array.isArray(data)) {
        setItems(data);
      }
    });
  }, []);

  if (items.length === 0) return (
    <div className="news-ticker-container">
      <div className="news-ticker-label">LATEST NEWS</div>
      <div className="news-ticker-wrapper">
        <div style={{ padding: '10px 20px', fontSize: '0.8rem', opacity: 0.7 }}>
          Stay tuned for latest hospital updates and health news...
        </div>
      </div>
    </div>
  );

  return (
    <div className="news-ticker-container">
      <div className="news-ticker-label">LATEST NEWS</div>
      <div className="news-ticker-wrapper">
        <div className="news-ticker-inner">
          {[...items, ...items, ...items].map((item, i) => (
            <span key={i} className="news-ticker-item">
              <i className={item.icon}></i>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [showPortal, setShowPortal] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [preSelectedDoctor, setPreSelectedDoctor] = useState<Doctor | undefined>();
  const [initialCancelMode, setInitialCancelMode] = useState(false);

  const handleBookAppointment = (doctor?: Doctor, cancelMode: boolean = false) => {
    setPreSelectedDoctor(doctor);
    setInitialCancelMode(cancelMode);
    setShowAppointment(true);
    setTimeout(() => {
      document.querySelector('#appointments')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFindDoctor = () => {
    document.querySelector('#doctors')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <ProgressBar />
      <IntroAnimation />
      <Navbar
        onAppointmentClick={() => handleBookAppointment(undefined, false)}
        onCancelClick={() => handleBookAppointment(undefined, true)}
        onPortalClick={() => setShowPortal(true)}
      />
      <main>
        {/* Hero */}
        <HeroSection onBook={() => handleBookAppointment()} onDoctors={handleFindDoctor} />

        {/* Hero News Scroller */}
        <NewsTicker />

        {/* Doctors */}
        <WorkingDoctorsSection onBook={handleBookAppointment} />

        {/* Appointment Booking Form */}
        {showAppointment && (
          <AppointmentSection preSelectedDoctor={preSelectedDoctor} initialCancelMode={initialCancelMode} />
        )}

        {/* About Section */}
        <div style={{ paddingTop: '2rem' }}>
          <AboutSection />
        </div>

        {/* Working Process */}
        {!showAppointment && (
          <div style={{ background: 'var(--bg-secondary)', paddingBottom: '2rem', marginTop: '1rem' }}>
            <WorkingProcess />
            <div style={{ textAlign: 'center', marginTop: '-1rem' }}>
              <button
                className="btn-primary"
                onClick={() => handleBookAppointment()}
                style={{ fontSize: '1.05rem', padding: '0.875rem 2.5rem' }}
              >
                <i className="fas fa-calendar-check"></i>
                Book an Appointment Now
              </button>
            </div>
          </div>
        )}

        {/* Ambulance Service */}
        <div style={{ marginTop: '1.5rem' }}>
          <AmbulanceService />
        </div>

        {/* Events, News & Achievements */}
        <div style={{ marginTop: '1.5rem' }}>
          <EventsSection />
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: '1.5rem' }}>
          <TestimonialsSection />
        </div>

        {/* Complaint & Suggestion Box */}
        <div style={{ marginTop: '1.5rem' }}>
          <ComplaintSuggestion />
        </div>
      </main >

      <Footer onBook={() => handleBookAppointment()} onPortal={() => setShowPortal(true)} />
      <BackToTop />
      <ChatBot />

      {showPortal && <PatientPortal onClose={() => setShowPortal(false)} />}

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 99999 }}
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
