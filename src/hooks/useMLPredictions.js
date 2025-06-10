/**
 * Hook for ML functionality
 * Modified to remove references to non-existent columns
 */
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

/**
 * Hook for machine learning functionality
 * @returns {Object} ML functions and state
 */
export const useMLPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch sales forecasts
   * @param {Object} options - Forecast options
   * @returns {Object} Forecast data
   */
  const fetchSalesForecast = useCallback(async (options = {}) => {
    const {
      startDate,
      endDate,
      forecastDays = 7,
      forceRefresh = false
    } = options;

    setLoading(true);
    setError(null);

    try {
      // DEVELOPMENT MODE: Use mock data when running locally
      if (window.location.hostname === 'localhost' && process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Using mock forecast data');
        return generateMockForecastData(startDate, endDate, forecastDays);
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('sales-forecasting', {
        body: { 
          startDate,
          endDate,
          forecastDays
        }
      });

      if (error) throw error;

      return data;
    } catch (err) {
      setError(`Failed to fetch sales forecast: ${err.message}`);
      toast.error('Could not generate sales forecast');
      
      // Return mock data as fallback
      return generateMockForecastData(startDate, endDate, forecastDays);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch inventory anomalies
   * @param {Object} options - Anomaly detection options
   * @returns {Array} Detected anomalies
   */
  const fetchInventoryAnomalies = useCallback(async (options = {}) => {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      sensitivity = 'medium', // low, medium, high
      forceRefresh = false
    } = options;

    setLoading(true);
    setError(null);

    try {
      // Only check database if not forcing refresh
      if (!forceRefresh) {
        // First check for stored anomalies - Using the actual schema of ml_anomalies
        let query = supabase
          .from('ml_anomalies')
          .select('*')
          .eq('anomaly_type', 'inventory');
        
        // Add date filters if provided
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }

        const { data: storedAnomalies, error: fetchError } = await query;

        if (fetchError) {
          console.error("Error fetching anomalies:", fetchError);
          if (!fetchError.message?.includes('column') && !fetchError.message?.includes('does not exist')) {
            throw fetchError;
          }
        }

        // If we have anomalies from last 24h, return them
        if (storedAnomalies?.length > 0) {
          const recentAnomalies = storedAnomalies.filter(
            a => new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          );

          if (recentAnomalies.length > 0) {
            return {
              anomalies: recentAnomalies,
              detected_at: new Date(Math.max(...recentAnomalies.map(a => new Date(a.created_at)))),
              cached: true
            };
          }
        }
      }

      // Otherwise, generate new anomalies via Edge Function
      const { data: detectedAnomalies, error } = await supabase.functions.invoke('detect-anomalies', {
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: 'inventory',
          sensitivity
        }
      });

      if (error) throw error;

      return {
        anomalies: detectedAnomalies.anomalies || [],
        detected_at: detectedAnomalies.detected_at || new Date().toISOString(),
        cached: false
      };
    } catch (err) {
      setError(`Failed to detect inventory anomalies: ${err.message}`);
      toast.error('Could not analyze inventory for anomalies');
      
      // Return empty data
      return {
        anomalies: [],
        detected_at: new Date().toISOString(),
        cached: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch product associations (market basket analysis)
   * @param {Object} options - Association options
   * @returns {Array} Product associations
   */
  const fetchProductAssociations = useCallback(async (options = {}) => {
    const {
      minSupport = 0.01,
      minConfidence = 0.3,
      itemId = null,
      category = null
    } = options;

    setLoading(true);
    setError(null);

    try {
      // DEVELOPMENT MODE: Use mock data when running locally
      if (window.location.hostname === 'localhost' && !process.env.NODE_ENV === 'production') {
        console.log('Development mode: Using mock product associations data');
        return generateMockAssociationData(minConfidence, minSupport);
      }

      // Call the Edge Function with the updated endpoint name
      const { data, error } = await supabase.functions.invoke('product-associations', {
        body: { 
          minSupport,
          minConfidence,
          itemId,
          category
        }
      });
      
      if (error) {
        console.error('Error from product-associations edge function:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return {
        rules: data?.rules || [],
        metrics: data?.metrics || {},
        cached: false
      };
      
    } catch (err) {
      setError(`Failed to fetch product associations: ${err.message}`);
      toast.error('Could not analyze product relationships');
      
      // Fall back to mock data
      return generateMockAssociationData(minConfidence, minSupport);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch inventory optimization recommendations
   * @returns {Object} Optimization recommendations
   */
  const fetchInventoryOptimizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // MODIFIED: Remove checking for is_applied column that doesn't exist
      // Just directly invoke the edge function without checking the database first
      const { data: optimizations, error } = await supabase.functions.invoke('inventory-optimizations', {
        body: {}
      });

      if (error) throw error;

      return {
        recommendations: optimizations.recommendations || [],
        potentialSavings: optimizations.potentialSavings || 0,
        wasteReduction: optimizations.wasteReduction || 0,
        cached: false
      };
    } catch (err) {
      setError(`Failed to fetch inventory optimizations: ${err.message}`);
      toast.error('Could not generate inventory optimizations');
      
      // Return empty data
      return {
        recommendations: [],
        potentialSavings: 0,
        wasteReduction: 0,
        cached: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Apply an inventory optimization recommendation
   * @param {number} recommendationId - Recommendation ID
   * @returns {boolean} Success status
   */
  const applyInventoryOptimization = useCallback(async (recommendationId) => {
    setLoading(true);
    setError(null);

    try {
      // Get the recommendation
      const { data: recommendation, error: fetchError } = await supabase
        .from('ml_inventory_recommendations')
        .select('*')
        .eq('recommendation_id', recommendationId)
        .single();

      if (fetchError) throw fetchError;

      // Update the ingredient based on the recommendation
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({
          [recommendation.recommendation_type === 'adjust_min' ? 'minimum_quantity' : 'quantity']: 
            recommendation.recommended_value,
          updated_at: new Date().toISOString()
        })
        .eq('ingredient_id', recommendation.ingredient_id);

      if (updateError) throw updateError;
      
      // MODIFIED: Don't try to update is_applied since it doesn't exist
      // Just delete the recommendation instead to remove it from the list
      const { error: deleteError } = await supabase
        .from('ml_inventory_recommendations')
        .delete()
        .eq('recommendation_id', recommendationId);
      
      if (deleteError) throw deleteError;

      toast.success('Recommendation applied successfully');
      return true;
    } catch (err) {
      setError(`Failed to apply optimization: ${err.message}`);
      toast.error('Could not apply optimization recommendation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get ML-based predictive metrics
   */
  const getPredictiveMetrics = useCallback(async (options = {}) => {
    const { startDate, endDate, forecastDays = 14, forceRefresh = false } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // For now, just return mock data
      return {
        profitPrediction: {
          nextMonth: {
            value: 85000,
            change: 7.5
          },
          nextQuarter: {
            value: 270000,
            change: 12.3
          }
        },
        revenueTrends: {
          trend: 'increasing',
          confidence: 0.87,
          forecastedRevenue: [
            { date: '2023-06-01', revenue: 25000 },
            { date: '2023-06-02', revenue: 27500 },
            { date: '2023-06-03', revenue: 24800 },
            // More dates...
          ]
        },
        costTrends: {
          trend: 'stable',
          confidence: 0.92,
          forecastedCosts: [
            { date: '2023-06-01', cost: 15000 },
            { date: '2023-06-02', cost: 14800 },
            { date: '2023-06-03', cost: 15200 },
            // More dates...
          ]
        },
        confidenceIntervals: {
          revenue: {
            upper: 32000,
            lower: 21000
          },
          profit: {
            upper: 14000,
            lower: 8000
          }
        },
        metrics: {
          accuracy: 91
        }
      };
    } catch (err) {
      setError(`Failed to get predictive metrics: ${err.message}`);
      toast.error('Could not generate financial predictions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to generate mock forecast data
  const generateMockForecastData = (startDate, endDate, days = 7) => {
    const forecast = [];
    const baseValue = 50000 + Math.random() * 10000;
    const now = new Date();
    
    // Generate past data (actual)
    for (let i = 14; i >= 1; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        prediction: null,
        actual: Math.round(baseValue * randomFactor),
        lower_bound: null,
        upper_bound: null
      });
    }
    
    // Generate future data (predictions)
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const value = Math.round(baseValue * randomFactor);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        prediction: value,
        actual: i === 0 ? value * 0.97 : null, // Only today has partial actual data
        lower_bound: Math.round(value * 0.8),
        upper_bound: Math.round(value * 1.2)
      });
    }
    
    return {
      forecast,
      accuracy: {
        mape: 8.3,
        rmse: 4267
      }
    };
  };
  
  // Helper function to generate mock association data
  const generateMockAssociationData = (minConfidence, minSupport) => {
    const mockRules = [
      {
        source_item_id: 1,
        source_name: "Americano",
        target_item_id: 5,
        target_name: "Croissant",
        support: 0.12,
        confidence: 0.65,
        lift: 3.2
      },
      {
        source_item_id: 2,
        source_name: "Cappuccino",
        target_item_id: 7,
        target_name: "Chocolate Muffin",
        support: 0.09,
        confidence: 0.55,
        lift: 2.8
      },
      {
        source_item_id: 3,
        source_name: "Latte",
        target_item_id: 6,
        target_name: "Blueberry Muffin",
        support: 0.07,
        confidence: 0.48,
        lift: 2.5
      }
      // Add more mock rules as needed
    ];
    
    // Filter by confidence and support
    const filteredRules = mockRules.filter(rule => 
      rule.confidence >= minConfidence && rule.support >= minSupport
    );
    
    return {
      rules: filteredRules,
      metrics: {
        avg_confidence: filteredRules.reduce((sum, rule) => sum + rule.confidence, 0) / filteredRules.length,
        avg_lift: filteredRules.reduce((sum, rule) => sum + rule.lift, 0) / filteredRules.length,
        rule_count: filteredRules.length,
        min_support: minSupport,
        min_confidence: minConfidence
      }
    };
  };

  // Public API
  return {
    loading,
    error,
    // Renamed for clarity
    getSalesForecast: fetchSalesForecast,
    detectInventoryAnomalies: fetchInventoryAnomalies,
    getProductAssociations: fetchProductAssociations,
    getInventoryOptimizations: fetchInventoryOptimizations,
    applyInventoryOptimization,
    getPredictiveMetrics
  };
};

export default useMLPredictions;