import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

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

const SalesForecastChart = ({ forecastData, dateRange, onExport }) => {
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef();
  
  useEffect(() => {
    if (forecastData?.dates?.length) {
      // Format dates for display
      const formattedDates = forecastData.dates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
      
      // Prepare chart data
      setChartData({
        labels: formattedDates,
        datasets: [
          {
            label: 'Actual Sales',
            data: forecastData.actual,
            borderColor: '#571C1F',
            backgroundColor: '#571C1F',
            pointBackgroundColor: '#571C1F',
            pointRadius: 4,
            borderWidth: 2
          },
          {
            label: 'Predicted Sales',
            data: forecastData.predictions,
            borderColor: '#FF9466',
            backgroundColor: '#FF9466',
            borderDash: [5, 5],
            pointRadius: 3,
            borderWidth: 2
          },
          {
            label: 'Prediction Range',
            data: forecastData.upperBound,
            borderColor: 'rgba(255, 148, 102, 0.2)',
            backgroundColor: 'rgba(255, 148, 102, 0.1)',
            pointRadius: 0,
            borderWidth: 0,
            fill: '+1' // Fill to the dataset below
          },
          {
            label: 'Lower Bound',
            data: forecastData.lowerBound,
            borderColor: 'rgba(255, 148, 102, 0.1)',
            pointRadius: 0,
            borderWidth: 0,
            fill: false,
            hidden: true // Don't show in legend
          }
        ]
      });
    }
  }, [forecastData]);

  // Enhanced cleanup effect
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        const chart = 
          chartRef.current.chartInstance || 
          (chartRef.current.canvas && ChartJS.getChart(chartRef.current.canvas));
          
        if (chart) {
          chart.destroy();
        }
      }
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Date: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `₱${context.parsed.y.toFixed(2)}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales (₱)'
        },
        ticks: {
          callback: (value) => `₱${value}`
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  if (!chartData) {
    return <div className="flex items-center justify-center h-60">Loading forecast data...</div>;
  }

  return (
    <div className="relative" style={{ height: "300px" }}>  {/* Add a fixed height container */}
      
      <div className="h-full pt-4"> {/* Change to h-full to fill the parent */}
        <Line
          data={chartData}
          options={{
            ...chartOptions,
            maintainAspectRatio: false, // Make sure this is set to false
            responsive: true // Make sure this is set to true
          }}
          ref={chartRef}
        />
        {forecastData.accuracy && (
          <div className="text-xs text-center mt-2 text-gray-500">
            Model Accuracy: {forecastData.accuracy}% • Period: {dateRange || 'Last 30 days'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesForecastChart;