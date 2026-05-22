import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Patient {
  patient_id: string;
  phone?: string;
  name?: string;
  age?: string | number;
  blood_group?: string;
}

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  patient: Patient | null;
  setPatient: (p: Patient | null) => void;
  logout: () => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [patient, setPatientState] = useState<Patient | null>(() => {
    const stored = sessionStorage.getItem('patient');
    return stored ? JSON.parse(stored) : null;
  });
  const [activeSection, setActiveSection] = useState('home');

  const setPatient = (p: Patient | null) => {
    setPatientState(p);
    if (p) sessionStorage.setItem('patient', JSON.stringify(p));
    else sessionStorage.removeItem('patient');
  };

  const logout = () => {
    setPatient(null);
    sessionStorage.removeItem('patient');
  };

  return (
    <AppContext.Provider value={{ 
      darkMode: false, 
      toggleDarkMode: () => {}, 
      patient, 
      setPatient, 
      logout, 
      activeSection, 
      setActiveSection 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
