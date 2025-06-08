import { format } from 'date-fns';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

const AnomalyDetectionPanel = ({ anomalies, startDate, endDate, onRefresh }) => {
  const [expanded, setExpanded] = useState({});
  
  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!anomalies || !anomalies.detected) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-2">Loading anomaly data...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (anomalies.detected.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No inventory anomalies detected during this period.</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-[#571C1F] text-white rounded hover:bg-[#3D1317] transition-colors"
        >
          Run Detection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-500">
            {anomalies.detected.length} anomalies detected
          </p>
          <p className="text-xs text-gray-400">
            Last analyzed: {formatDate(anomalies.detected_at)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#571C1F] text-white rounded hover:bg-[#3D1317] transition-colors"
        >
          Refresh Analysis
        </button>
      </div>

      <div className="space-y-3">
        {anomalies.detected.map((anomaly) => (
          <div 
            key={anomaly.anomaly_id || `anomaly-${anomaly.resource_id}`}
            className={`border rounded-lg overflow-hidden ${getSeverityClass(anomaly.severity)}`}
          >
            <div 
              className="flex justify-between items-center p-4 cursor-pointer"
              onClick={() => toggleExpand(anomaly.anomaly_id)}
            >
              <div>
                <div className="font-medium">{anomaly.description?.split(': ')[0] || 'Anomaly Detected'}</div>
                <div className="text-sm">{anomaly.description?.split(': ')[1] || anomaly.description}</div>
              </div>
              <div className="flex items-center">
                <div className={`px-2 py-1 rounded-full text-xs font-medium`}>
                  {anomaly.severity}
                </div>
                {expanded[anomaly.anomaly_id] ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {expanded[anomaly.anomaly_id] && (
              <div className="px-4 py-3 border-t bg-white">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Detection Date</div>
                    <div>{format(new Date(anomaly.detection_date), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Anomaly Score</div>
                    <div>{anomaly.score.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Expected Value</div>
                    <div>{anomaly.expected_value?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Actual Value</div>
                    <div>{anomaly.actual_value?.toFixed(2) || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button 
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Mark as reviewed
                    }}
                  >
                    Mark as Reviewed
                  </button>
                  <button 
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // View details
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalyDetectionPanel;