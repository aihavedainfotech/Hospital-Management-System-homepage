import React, { useState, useEffect } from 'react';
import { fetchDoctors } from '../api';

const DebugComponent: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        console.log('Starting to fetch doctors...');
        setLoading(true);
        setError(null);
        
        const response = await fetchDoctors();
        console.log('Doctors response:', response);
        
        if (response && response.data) {
          setDoctors(response.data);
          console.log('Doctors loaded:', response.data);
        } else {
          setError('No data received');
        }
      } catch (err) {
        console.error('Error loading doctors:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 API Debug Component</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {loading ? 'Loading...' : 'Loaded'}
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Doctors Count:</strong> {doctors.length}
      </div>
      
      {doctors.length > 0 && (
        <div>
          <h3>Doctors Data:</h3>
          <ul>
            {doctors.map((doctor: any) => (
              <li key={doctor.id}>
                <strong>{doctor.name}</strong> - {doctor.department} - {doctor.specialization}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h4>🌐 API Configuration</h4>
        <p><strong>Base URL:</strong> {import.meta.env?.VITE_API_URL || 'http://127.0.0.1:5000'}</p>
        <p><strong>Current URL:</strong> {window.location.origin}</p>
      </div>
    </div>
  );
};

export default DebugComponent;
