import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PredictiveMetricsPanel = ({ metrics, dateRange, onRefresh }) => {
  const [chartData, setChartData] = useState(null);
  const [featureData, setFeatureData] = useState(null);
  
  useEffect(() => {
    if (metrics?.profitPrediction) {
      // Format data for Chart.js - profit/cost/revenue trends
      const labels = metrics.profitPrediction.dates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });

      const chartDataObj = {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: metrics.revenueTrends?.values || [],
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Costs',
            data: metrics.costTrends?.values || [],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Profit',
            data: metrics.profitPrediction.values,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Lower Bound',
            data: metrics.confidenceIntervals?.lower || [],
            borderColor: 'rgba(175, 175, 175, 0.5)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            pointRadius: 0,
            borderDashed: [5, 5],
            borderWidth: 1,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Upper Bound',
            data: metrics.confidenceIntervals?.upper || [],
            borderColor: 'rgba(175, 175, 175, 0.5)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            pointRadius: 0,
            borderDashed: [5, 5],
            borderWidth: 1,
            tension: 0.3,
            fill: {
              target: '-1',
              above: 'rgba(75, 192, 192, 0.1)'
            },
            yAxisID: 'y'
          }
        ]
      };
      
      setChartData(chartDataObj);
      
      // Feature importance chart
      if (metrics.featureImportance?.length) {
        const featureImportance = [...metrics.featureImportance]
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 10);
        
        setFeatureData({
          labels: featureImportance.map(f => f.feature),
          datasets: [
            {
              label: 'Feature Importance',
              data: featureImportance.map(f => f.importance),
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        });
      }
    }
  }, [metrics]);

  if (!metrics || !metrics.profitPrediction) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-center">
          <p className="text-gray-600">No predictive data available</p>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="mt-4 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Generate Predictions
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="font-medium">Financial Performance Forecast</div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-xs text-blue-700">Projected Revenue</p>
          <p className="font-medium text-blue-800">
            ₱{metrics.revenueTrends?.projection?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-blue-600">
            {metrics.revenueTrends?.change > 0 ? '+' : ''}
            {metrics.revenueTrends?.change?.toFixed(2)}% vs. previous period
          </p>
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-xs text-red-700">Projected Costs</p>
          <p className="font-medium text-red-800">
            ₱{metrics.costTrends?.projection?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-red-600">
            {metrics.costTrends?.change > 0 ? '+' : ''}
            {metrics.costTrends?.change?.toFixed(2)}% vs. previous period
          </p>
        </div>
        
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-xs text-green-700">Projected Profit</p>
          <p className="font-medium text-green-800">
            ₱{metrics.profitPrediction?.projection?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-green-600">
            {metrics.profitPrediction?.change > 0 ? '+' : ''}
            {metrics.profitPrediction?.change?.toFixed(2)}% vs. previous period
          </p>
        </div>
      </div>
      
      {chartData && (
        <div className="mb-6">
          <div className="h-60">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      callback: (value) => `₱${value}`
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Forecast period: {dateRange || 'Next 14 days'} • 
            Confidence interval: {metrics.confidenceIntervals?.confidence || 95}%
          </p>
        </div>
      )}
      
      {featureData && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Factors Influencing Predictions</h4>
          <div className="h-60">
            <Line
              data={featureData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Importance Score'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveMetricsPanel;