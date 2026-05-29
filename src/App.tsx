import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './reference-styles.css';
import './index.css';
import { AppProvider } from './context/AppContext';
import IntroAnimation from './components/IntroAnimation';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import AppointmentSection from './components/AppointmentSection';
import DepartmentsSection from './components/DepartmentsSection';
import HealthTipsSection from './components/HealthTipsSection';
import NewsSection from './components/NewsSection';
import AwardsSection from './components/AwardsSection';
import PatientPortal from './components/PatientPortal';
import ComplaintSuggestion from './components/ComplaintSuggestion';
import Footer, { BackToTop, ProgressBar } from './components/FooterAndMisc';
import ChatBot from './components/ChatBot';
import FloatingBanner from './components/FloatingBanner';
import { Doctor } from './api';

function AppContent() {
  const [showPortal, setShowPortal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [preSelectedDoctor, setPreSelectedDoctor] = useState<Doctor | undefined>();
  const [initialCancelMode, setInitialCancelMode] = useState(false);

  const handleBookAppointment = (doctor?: Doctor, cancelMode: boolean = false) => {
    setPreSelectedDoctor(doctor);
    setInitialCancelMode(cancelMode);
    setTimeout(() => {
      document.querySelector('#appointments')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFindDoctor = () => {
    document.querySelector('#departments')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <ProgressBar />
      <IntroAnimation />
      <Navbar
        onAppointmentClick={() => handleBookAppointment(undefined, false)}
        onCancelClick={() => handleBookAppointment(undefined, true)}
        onPortalClick={() => setShowPortal(true)}
        onFeedbackClick={() => setShowFeedback(!showFeedback)}
      />
      <FloatingBanner 
        onBook={() => handleBookAppointment(undefined, false)}
        onFindDoctor={handleFindDoctor}
        onCancel={() => handleBookAppointment(undefined, true)}
        onFeedback={() => setShowFeedback(true)}
      />
      
      <main>
        {/* 1. Hero */}
        <HeroSection onBook={() => handleBookAppointment()} onDoctors={handleFindDoctor} />

        {/* 2. Services */}
        <ServicesSection />

        {/* 3. Booking */}
        <AppointmentSection preSelectedDoctor={preSelectedDoctor} initialCancelMode={initialCancelMode} />

        {/* 4. Departments */}
        <DepartmentsSection onBook={(doctor) => handleBookAppointment(doctor, false)} />

        {/* 5. Health Tips */}
        <HealthTipsSection />

        {/* 6. News */}
        <NewsSection />

        {/* 7. Awards */}
        <AwardsSection />

        {/* Complaint & Suggestion Box Modal (Hidden by default) */}
        {showFeedback && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 45, 82, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '860px', maxHeight: '94vh', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ComplaintSuggestion onClose={() => setShowFeedback(false)} />
            </div>
          </div>
        )}
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
