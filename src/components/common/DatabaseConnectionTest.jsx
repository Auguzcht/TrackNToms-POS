// filepath: c:\Users\MYPC\Desktop\MMCM\COMPSCI 2ND YR\2T\IM - CS107\TrackNToms-POS\TrackNToms-POS\src\components\common\DatabaseConnectionTest.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from './Card';

// Use import.meta.env instead of process.env for Vite projects
const DB_NAME = import.meta.env.VITE_DB_NAME || 'trackntoms';

const DatabaseConnectionTest = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [tablesInfo, setTablesInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const response = await api.get('/test-db-connection');
        console.log('Database connection response:', response.data);
        
        if (response.data.connected) {
          setStatus('connected');
          setServerInfo(response.data.serverInfo);
          
          // Also fetch table information
          try {
            const tablesResponse = await api.get('/tables');
            if (tablesResponse.data.success) {
              setTablesInfo(tablesResponse.data);
            }
          } catch (tableError) {
            console.error('Error fetching tables:', tableError);
          }
        } else {
          setStatus('failed');
          setError('Database connection failed');
        }
      } catch (error) {
        console.error('Error testing connection:', error);
        setStatus('failed');
        setError(error.response?.data?.error || error.message);
      }
    };
    
    testConnection();
  }, []);
  
  const handleSetupClick = async () => {
    try {
      setStatus('setting_up');
      const response = await api.get('/setup-database');
      if (response.data.success) {
        setStatus('setup_complete');
        // Refresh tables info
        const tablesResponse = await api.get('/tables');
        if (tablesResponse.data.success) {
          setTablesInfo(tablesResponse.data);
        }
      } else {
        setError('Database setup failed');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      setError(error.response?.data?.error || error.message);
    }
  };
  
  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Database Connection</h2>
        {status === 'connected' && (
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-500 hover:underline"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      
      {status === 'checking' && (
        <div className="animate-pulse">
          <p className="text-yellow-500 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking database connection...
          </p>
        </div>
      )}
      
      {status === 'setting_up' && (
        <div className="animate-pulse">
          <p className="text-yellow-500 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Setting up database tables...
          </p>
        </div>
      )}
      
      {status === 'connected' && (
        <div>
          <p className="text-green-500 flex items-center mb-2">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Successfully connected to XAMPP database
          </p>
          
          {showDetails && serverInfo && (
            <div className="mt-3 text-sm border-t border-gray-200 pt-2">
              <p className="text-gray-700"><span className="font-semibold">Database:</span> {serverInfo.current_db || DB_NAME}</p>
              <p className="text-gray-700"><span className="font-semibold">Version:</span> {serverInfo.version}</p>
              <p className="text-gray-700"><span className="font-semibold">Charset:</span> {serverInfo.charset}</p>
              <p className="text-gray-700"><span className="font-semibold">Collation:</span> {serverInfo.collation}</p>
              
              {tablesInfo && (
                <div className="mt-2">
                  <p className="font-semibold text-gray-700">Tables: {tablesInfo.tableDetails?.length || 0}</p>
                  {tablesInfo.tableDetails?.length > 0 ? (
                    <div className="mt-1 overflow-auto max-h-60">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-1 px-2 text-left">Table</th>
                            <th className="py-1 px-2 text-left">Columns</th>
                            <th className="py-1 px-2 text-left">Rows</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tablesInfo.tableDetails.map((table, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-1 px-2">{table.name}</td>
                              <td className="py-1 px-2">{table.columns}</td>
                              <td className="py-1 px-2">{table.rows}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex mt-4">
                      <button 
                        onClick={handleSetupClick}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
                      >
                        Initialize Tables
                      </button>
                      <p className="text-gray-500 text-xs ml-2 self-center">No tables found. Click to set up the database.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {status === 'setup_complete' && (
        <div>
          <p className="text-green-500 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Database setup complete!
          </p>
          
          {tablesInfo && tablesInfo.tableDetails?.length > 0 && (
            <div className="mt-2 text-xs">
              <p className="text-gray-700 font-semibold">Tables created: {tablesInfo.tableDetails.length}</p>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                {showDetails ? 'Hide Table Details' : 'Show Table Details'}
              </button>
              
              {showDetails && (
                <div className="mt-1 overflow-auto max-h-60">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-1 px-2 text-left">Table</th>
                        <th className="py-1 px-2 text-left">Columns</th>
                        <th className="py-1 px-2 text-left">Rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablesInfo.tableDetails.map((table, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-1 px-2">{table.name}</td>
                          <td className="py-1 px-2">{table.columns}</td>
                          <td className="py-1 px-2">{table.rows}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {(status === 'failed' || error) && (
        <div>
          <p className="text-red-500 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
            Database connection failed
          </p>
          {error && <p className="text-sm text-gray-600 mt-1">{error}</p>}
          
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-2">
            <p className="text-xs text-yellow-700">
              <span className="font-bold">Troubleshooting:</span>
            </p>
            <ul className="text-xs list-disc list-inside text-yellow-700 mt-1">
              <li>Ensure XAMPP is running with MySQL service started</li>
              <li>Check database name in .env file: {DB_NAME}</li>
              <li>Verify MySQL username/password in .env file</li>
              <li>Make sure Express server is running: <code>node src/server/index.js</code></li>
            </ul>
            <button 
              onClick={() => window.location.reload()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded mt-2"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DatabaseConnectionTest;