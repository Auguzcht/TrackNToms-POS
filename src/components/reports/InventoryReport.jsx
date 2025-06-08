import { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import { useInventory } from '../../hooks/useInventory';
import { useMLPredictions } from '../../hooks/useMLPredictions'; // Updated name
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Import ML components
import AnomalyDetectionPanel from '../ml/AnomalyDetectionPanel';
import InventoryOptimizationPanel from '../ml/InventoryOptimizationPanel';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InventoryReport = ({ 
  startDate = null,
  endDate = null, 
  onExport = () => {} 
}) => {
  const { ingredients, items, loading: inventoryLoading, fetchInventory } = useInventory();
  const { detectInventoryAnomalies, getInventoryOptimizations } = useMLPredictions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add states for ML components
  const [anomalies, setAnomalies] = useState({
    detected: [],
    detected_at: new Date().toISOString(),
    severity: 'low'
  });
  
  const [optimizationData, setOptimizationData] = useState({
    recommendations: [],
    potentialSavings: 0,
    wasteReduction: 0
  });
  
  const [reportData, setReportData] = useState({
    ingredients: [],
    items: [],
    summary: {
      totalIngredients: 0,
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      inventoryValue: 0
    },
    movementData: {
      purchases: [],
      pullouts: [],
      usage: []
    }
  });

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `Since ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  useEffect(() => {
    const generateInventoryReport = async () => {
      setLoading(true);
      try {
        // Fetch inventory data
        const inventoryData = await fetchInventory();
        
        // Process ingredients data
        const processedIngredients = (inventoryData.ingredients || []).map(ing => {
          // Calculate value
          const value = ing.quantity * ing.unit_cost || 0;
          
          // Calculate stock status
          let stockStatus = 'normal';
          if (ing.quantity <= 0) {
            stockStatus = 'out';
          } else if (ing.quantity <= ing.minimum_quantity) {
            stockStatus = 'low';
          }
          
          return {
            ...ing,
            value,
            stockStatus,
            lastRestockDate: ing.last_restock_date ? new Date(ing.last_restock_date).toLocaleDateString() : 'N/A'
          };
        });
        
        // Calculate summary metrics
        const totalIngredients = processedIngredients.length;
        const lowStockItems = processedIngredients.filter(ing => ing.stockStatus === 'low').length;
        const outOfStockItems = processedIngredients.filter(ing => ing.stockStatus === 'out').length;
        const inventoryValue = processedIngredients.reduce((sum, ing) => sum + ing.value, 0);
        
        // Fetch inventory movement data
        // In a real implementation, we'd call an API endpoint to get this
        // For now we'll simulate it
        const movementData = {
          purchases: [], // Would fetch from purchase_details table
          pullouts: [], // Would fetch from pullout table
          usage: [] // Would calculate from sales data
        };
        
        setReportData({
          ingredients: processedIngredients,
          items: inventoryData.items,
          summary: {
            totalIngredients,
            totalItems: inventoryData.items.length,
            lowStockItems,
            outOfStockItems,
            inventoryValue
          },
          movementData
        });

        // Fetch ML anomaly detections
        const anomalyResults = await detectInventoryAnomalies({ 
          startDate: startDate ? new Date(startDate) : undefined, 
          endDate: endDate ? new Date(endDate) : undefined 
        });
        
        setAnomalies(anomalyResults);
        
        // Fetch ML inventory optimization recommendations
        const optimizationResults = await getInventoryOptimizations();
        
        setOptimizationData(optimizationResults);
        
      } catch (err) {
        console.error('Error generating inventory report:', err);
        setError('Failed to generate inventory report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateInventoryReport();
  }, [fetchInventory, detectInventoryAnomalies, getInventoryOptimizations, startDate, endDate]);

  // Handle refreshing anomaly detection
  const handleRefreshAnomalyDetection = async () => {
    try {
      const anomalyResults = await detectInventoryAnomalies({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        forceRefresh: true
      });
      
      setAnomalies(anomalyResults);
    } catch (err) {
      console.error('Error refreshing anomaly detection:', err);
    }
  };

  // Handle applying inventory optimization recommendations
  const handleApplyRecommendations = async (recommendationIds) => {
    try {
      // Process each recommendation
      for (const id of recommendationIds) {
        await applyInventoryOptimization(id);
      }
      
      // Refresh the optimization data
      const newOptimizationData = await getInventoryOptimizations();
      setOptimizationData(newOptimizationData);
      
      // Also refresh inventory data
      const inventoryData = await fetchInventory();
      
      // Update the report data with new inventory values
      // Similar to the initial data processing...
    } catch (err) {
      console.error('Error applying recommendations:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Generating inventory report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Inventory Report {dateRangeText ? `(${dateRangeText})` : ''}
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard 
          title="Total Ingredients"
          value={reportData.summary.totalIngredients}
          subtext="Categories in stock"
          color="default"
          icon="ingredients"
        />
        <SummaryCard 
          title="Low Stock"
          value={reportData.summary.lowStockItems}
          subtext="Items below minimum"
          color="warning"
          icon="alert"
        />
        <SummaryCard 
          title="Out of Stock"
          value={reportData.summary.outOfStockItems}
          subtext="Items at zero"
          color="danger"
          icon="error"
        />
        <SummaryCard 
          title="Menu Items"
          value={reportData.summary.totalItems}
          subtext="Active items"
          color="primary"
          icon="food"
        />
        <SummaryCard 
          title="Inventory Value"
          value={`₱${reportData.summary.inventoryValue.toFixed(2)}`}
          subtext="Total ingredient value"
          color="success"
          icon="money"
        />
      </div>

      {/* ML Component - Anomaly Detection */}
      <Card title="Inventory Anomaly Detection">
        <AnomalyDetectionPanel 
          anomalies={anomalies} 
          startDate={startDate}
          endDate={endDate}
          onRefresh={handleRefreshAnomalyDetection}
        />
      </Card>

      {/* ML Component - Inventory Optimization */}
      <Card title="Inventory Optimization Recommendations">
        <InventoryOptimizationPanel 
          data={optimizationData}
          ingredients={ingredients}
          onApply={handleApplyRecommendations}
        />
      </Card>

      {/* Ingredients Inventory */}
      <Card title="Ingredients Inventory">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Restock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.ingredients.map((ingredient, index) => (
                <tr 
                  key={ingredient.ingredient_id} 
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ingredient.quantity} {ingredient.unit}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ingredient.minimum_quantity} {ingredient.unit}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₱{parseFloat(ingredient.unit_cost).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₱{ingredient.value.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {ingredient.lastRestockDate}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ingredient.stockStatus === 'normal' ? 'bg-green-100 text-green-800' : 
                        ingredient.stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {ingredient.stockStatus === 'normal' ? 'Normal' : 
                       ingredient.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Summary Card component
const SummaryCard = ({ title, value, subtext, color = 'default', icon }) => {
  // Card implementation
  return (
    <div className={`p-4 rounded-lg shadow-sm 
      ${color === 'primary' ? 'bg-blue-50 text-blue-800' :
        color === 'success' ? 'bg-green-50 text-green-800' :
        color === 'warning' ? 'bg-yellow-50 text-yellow-800' :
        color === 'danger' ? 'bg-red-50 text-red-800' :
        'bg-gray-50 text-gray-800'}`}>
      {/* Card content */}
    </div>
  );
};

export default InventoryReport;