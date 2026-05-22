import React, { useState, useEffect } from 'react';
import { Doctor, fetchDoctors } from '../api';
import apiClient from '../services/apiClient';

const SimpleDoctorsSection: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        console.log('🔄 Loading doctors...');
        setLoading(true);
        setError(null);
        
        // Simple direct API call
        const response = await apiClient.get('/homepage/doctors');
        
        const data = response.data;
        console.log('✅ Doctors loaded:', data);
        
        const doctorsArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        if (doctorsArray.length > 0 || Array.isArray(data.data) || Array.isArray(data)) {
          setDoctors(doctorsArray);
          console.log(`✅ Set ${doctorsArray.length} doctors`);
        } else {
          throw new Error('No valid doctors array received');
        }
        
      } catch (err) {
        console.error('❌ Error loading doctors:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #007bff', 
            borderTop: '4px solid #007bff transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontSize: '18px',
        color: '#dc3545'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <p>❌ Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🏥 Our Doctors ({doctors.length})</h2>
      
      {doctors.map((doctor) => (
        <div key={doctor.id} style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px'
            }}>
              <i className="fas fa-user-md" style={{ fontSize: '24px', color: '#6c757d' }}></i>
            </div>
            <div>
              <h3 style={{ margin: '0', color: '#333' }}>{doctor.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>{doctor.specialization}</p>
              <p style={{ margin: '5px 0', color: '#007bff', fontWeight: 'bold' }}>{doctor.department}</p>
              <p style={{ margin: '5px 0', color: '#666' }}>{doctor.experience} years experience</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#666' }}>
            <span>⏰ {doctor.available_days}</span>
            <span>⏱ {doctor.timings}</span>
            <span>⭐ {doctor.rating}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleDoctorsSection;
