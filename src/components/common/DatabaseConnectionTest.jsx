// src/components/common/DatabaseConnectionTest.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from './Card';

const DatabaseConnectionTest = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get('/test-db-connection');
        if (response.data.connected) {
          setStatus('connected');
        } else {
          setStatus('failed');
          setError('Database connection failed');
        }
      } catch (error) {
        console.error('Error testing connection:', error);
        setStatus('failed');
        setError(error.message);
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2">Database Connection</h2>
      
      {status === 'checking' && (
        <p className="text-yellow-500">Checking database connection...</p>
      )}
      
      {status === 'connected' && (
        <p className="text-green-500">✓ Successfully connected to database</p>
      )}
      
      {status === 'failed' && (
        <div>
          <p className="text-red-500">✕ Database connection failed</p>
          {error && <p className="text-sm text-gray-600 mt-1">{error}</p>}
        </div>
      )}
    </Card>
  );
};

export default DatabaseConnectionTest;