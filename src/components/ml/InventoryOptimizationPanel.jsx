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
      // Find the selected recommendations objects
      const selectedRecs = data.recommendations.filter(rec => 
        selectedRecommendations.includes(rec.id)
      );
      
      // Pass both IDs and full recommendation objects to the handler
      onApply(selectedRecommendations, selectedRecs);
    }
  };
  
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="p-4 border rounded-md border-green-100 bg-green-50/50">
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
    <div className="rounded-md bg-white">
      <div className="mb-4 flex flex-col lg:flex-row justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="bg-green-50/80 p-3 rounded-md border border-green-200 flex-grow lg:flex-grow-0">
            <p className="text-xs text-green-700 font-medium">Potential Savings</p>
            <p className="font-bold text-green-800 text-lg">{formatCurrency(data.potentialSavings || 0)}</p>
          </div>
          <div className="bg-blue-50/80 p-3 rounded-md border border-blue-200 flex-grow lg:flex-grow-0">
            <p className="text-xs text-blue-700 font-medium">Waste Reduction</p>
            <p className="font-bold text-blue-800 text-lg">{data.wasteReduction?.toFixed(2) || 0} units</p>
          </div>
          <div className="bg-amber-50/80 p-3 rounded-md border border-amber-200 flex-grow lg:flex-grow-0">
            <p className="text-xs text-amber-700 font-medium">Recommendations</p>
            <p className="font-bold text-amber-800 text-lg">{data.recommendations.length}</p>
          </div>
        </div>
        
        <button 
          className={`mt-4 lg:mt-0 px-4 py-2 rounded-md transition-all shadow-sm border flex items-center justify-center ${
            selectedRecommendations.length 
              ? 'bg-[#571C1F] text-white hover:bg-[#571C1F]/90 border-[#571C1F]' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
          }`}
          disabled={!selectedRecommendations.length}
          onClick={handleApplySelected}
        >
          {selectedRecommendations.length > 0 && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          Apply Selected ({selectedRecommendations.length})
        </button>
      </div>
      
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#FFF6F2]/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="rounded text-[#571C1F] focus:ring-[#571C1F]/50 border-gray-300"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRecommendations(data.recommendations.map(r => r.id));
                    } else {
                      setSelectedRecommendations([]);
                    }
                  }}
                  checked={selectedRecommendations.length === data.recommendations.length && data.recommendations.length > 0}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Ingredient
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Current
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Recommended
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Confidence
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#571C1F]/10">
            {data.recommendations.map((rec, index) => {
              const typeDisplay = getRecommendationTypeDisplay(rec.type);
              
              return (
                <tr key={rec.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF6F2]/20'} hover:bg-[#FFF6F2]/40 transition-colors`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="rounded text-[#571C1F] focus:ring-[#571C1F]/50 border-gray-300"
                      checked={selectedRecommendations.includes(rec.id)}
                      onChange={() => toggleRecommendation(rec.id)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{rec.ingredient.name}</div>
                    <div className="text-gray-500 text-xs">{rec.ingredient.unit}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeDisplay.color}`}>
                      {typeDisplay.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                    {rec.currentValue} {rec.ingredient.unit}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-blue-700">
                      {rec.recommendedValue} {rec.ingredient.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="w-20 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${
                          rec.confidence > 0.7 ? 'bg-green-600' :
                          rec.confidence > 0.5 ? 'bg-blue-600' :
                          'bg-amber-500'
                        } h-2.5 rounded-full`}
                        style={{ width: `${rec.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{Math.round(rec.confidence * 100)}% confidence</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{rec.reason}</span>
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