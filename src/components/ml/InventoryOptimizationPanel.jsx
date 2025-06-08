import { useState } from 'react';

const InventoryOptimizationPanel = ({ data, ingredients, onApply }) => {
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);
  
  const toggleRecommendation = (id) => {
    setSelectedRecommendations(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value);
  };
  
  const getRecommendationTypeDisplay = (type) => {
    switch (type) {
      case 'restock':
        return {
          label: 'Restock',
          color: 'text-green-700 bg-green-50 border-green-200'
        };
      case 'reduce':
        return {
          label: 'Reduce',
          color: 'text-orange-700 bg-orange-50 border-orange-200'
        };
      case 'adjust_min':
        return {
          label: 'Adjust Min',
          color: 'text-blue-700 bg-blue-50 border-blue-200'
        };
      default:
        return {
          label: type,
          color: 'text-gray-700 bg-gray-50 border-gray-200'
        };
    }
  };
  
  const handleApplySelected = () => {
    if (selectedRecommendations.length > 0 && onApply) {
      onApply(selectedRecommendations);
    }
  };
  
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-gray-50">
        <div className="flex flex-col items-center justify-center py-6">
          <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 font-medium">Inventory is optimized</p>
          <p className="text-gray-500 text-sm mt-1">No optimization recommendations at this time</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between">
        <div className="flex space-x-4">
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-xs text-green-700">Potential Savings</p>
            <p className="font-medium text-green-800">{formatCurrency(data.potentialSavings || 0)}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <p className="text-xs text-blue-700">Waste Reduction</p>
            <p className="font-medium text-blue-800">{data.wasteReduction?.toFixed(2) || 0} units</p>
          </div>
        </div>
        
        <button 
          className={`mt-3 sm:mt-0 px-4 py-2 rounded ${selectedRecommendations.length ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          disabled={!selectedRecommendations.length}
          onClick={handleApplySelected}
        >
          Apply Selected ({selectedRecommendations.length})
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="rounded text-blue-600"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRecommendations(data.recommendations.map(r => r.id));
                    } else {
                      setSelectedRecommendations([]);
                    }
                  }}
                  checked={selectedRecommendations.length === data.recommendations.length}
                />
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingredient
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recommended
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.recommendations.map((rec) => {
              const typeDisplay = getRecommendationTypeDisplay(rec.type);
              
              return (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-600"
                      checked={selectedRecommendations.includes(rec.id)}
                      onChange={() => toggleRecommendation(rec.id)}
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{rec.ingredient.name}</div>
                    <div className="text-gray-500 text-xs">{rec.ingredient.unit}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeDisplay.color}`}>
                      {typeDisplay.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {rec.currentValue} {rec.ingredient.unit}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-blue-700">
                      {rec.recommendedValue} {rec.ingredient.unit}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${rec.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{(rec.confidence * 100).toFixed(1)}%</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-gray-500">{rec.reason}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryOptimizationPanel;