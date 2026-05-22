import React, { useState, useEffect } from 'react';
import { fetchDepartments } from '../api';

const SimpleDepartmentsSection: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        console.log('🔄 Loading departments...');
        setLoading(true);
        setError(null);

        // Use the centralized fetchDepartments API call
        const data = await fetchDepartments();
        console.log('✅ Departments loaded:', data);

        if (data && Array.isArray(data)) {
          setDepartments(data);
          console.log(`✅ Set ${data.length} departments`);
        } else if (data && data.data) {
          setDepartments(data.data);
          console.log(`✅ Set ${data.data.length} departments`);
        } else {
          throw new Error('No data received');
        }

      } catch (err) {
        console.error('❌ Error loading departments:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
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
          <p>Loading departments...</p>
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
      <h2 style={{ marginBottom: '20px' }}>🏥 Our Departments ({departments.length})</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {departments.map((dept, index) => (
          <div key={index} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px'
            }}>
              <i className="fas fa-hospital" style={{ fontSize: '24px', color: '#6c757d' }}></i>
            </div>
            <h3 style={{ margin: '0', color: '#333' }}>{dept.name}</h3>
            <p style={{ color: '#666' }}>{dept.doctor_count} doctors available</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleDepartmentsSection;
