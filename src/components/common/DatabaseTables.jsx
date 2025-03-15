import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from './Card';

const DatabaseTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await api.get('/test-db-connection'); // Remove /api prefix
        if (response.data.connected) {
          const tablesResponse = await api.get('/tables'); // Remove /api prefix
          if (tablesResponse.data.success) {
            setTables(tablesResponse.data.tables);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tables:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
      
      {loading && <p className="text-yellow-500">Loading tables...</p>}
      
      {error && (
        <p className="text-red-500">Error loading tables: {error}</p>
      )}
      
      {!loading && !error && (
        <div className="space-y-2">
          {tables.map((table, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded">
              <p className="font-medium">{Object.values(table)[0]}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default DatabaseTables;