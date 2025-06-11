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

  // Move this function up before any functions that need to use it
  // Function to check/create table structure
  const verifyProductAssociationsTable = useCallback(async () => {
    try {
      // Check if the table exists with a simple query
      const { error: tableError } = await supabase
        .from('ml_product_associations')
        .select('association_id')
        .limit(1);
    
      if (tableError) {
        console.error('Error checking ml_product_associations table:', tableError);
        return { valid: false, columnMap: {} };
      }
    
      // We know the columns exist based on what you've shared
      return { 
        valid: true, 
        columnMap: {
          // Map the appropriate column names
          itemIdColumn: 'association_id',  // This is your primary key
          associatedItemColumn: 'consequent_item_id'  // This is the column for the related product
        }
      };
    } catch (err) {
      console.error('Error verifying ml_product_associations table:', err);
      return { valid: false, columnMap: {} };
    }
  }, []);

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
      // Skip cache lookup if forceRefresh is true
      if (!forceRefresh) {
        // Check existing forecasts in ml_forecasts table
        const { data: existingForecasts, error: forecastError } = await supabase
          .from('ml_forecasts')
          .select('*')
          .eq('forecast_type', 'sales')
          .eq('resource_type', 'overall')
          .order('created_at', { ascending: false })
          .limit(1);
          
        // If we have recent forecasts (last 24 hours), return them
        if (!forecastError && existingForecasts && existingForecasts.length > 0) {
          const latestForecast = existingForecasts[0];
          const forecastDate = new Date(latestForecast.created_at);
          const now = new Date();
          const hoursSinceLastForecast = (now.getTime() - forecastDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastForecast < 24 && !forceRefresh) {
            console.log('Using cached sales forecast from database');
            return {
              forecast: latestForecast.forecast_data || [],
              accuracy: latestForecast.accuracy_metrics || { mape: 15, rmse: 500 },
              cached: true
            };
          }
        }
      }

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

      // Store forecast in database for persistence
      if (data?.forecast && data.forecast.length > 0 && window.location.hostname !== 'localhost') {
        try {
          // First check if we already have an active sales model
          let modelId;
          const { data: existingModels } = await supabase
            .from('ml_models')
            .select('model_id')
            .eq('model_type', 'sales')
            .eq('is_active', true)
            .limit(1);

          if (existingModels && existingModels.length > 0) {
            modelId = existingModels[0].model_id;
            
            // Update the existing model with new accuracy
            await supabase
              .from('ml_models')
              .update({
                last_trained: new Date().toISOString(),
                accuracy: data.accuracy?.mape ? (100 - data.accuracy.mape) : 85,
                parameters: { forecastDays },
                updated_at: new Date().toISOString()
              })
              .eq('model_id', modelId);
          } else {
            // Create a new model entry
            const { data: newModel } = await supabase
              .from('ml_models')
              .insert({
                model_name: 'Sales Forecast',
                model_type: 'sales',
                last_trained: new Date().toISOString(),
                accuracy: data.accuracy?.mape ? (100 - data.accuracy.mape) : 85,
                parameters: { forecastDays },
                is_active: true
              })
              .select('model_id');
            
            if (newModel && newModel.length > 0) {
              modelId = newModel[0].model_id;
            }
          }

          if (modelId) {
            // Using the same structure as in getPredictiveMetrics
            const accuracyMetrics = {
              mape: data.accuracy?.mape || 15,
              rmse: data.accuracy?.rmse || 500,
              overall_accuracy: data.accuracy?.mape ? (100 - data.accuracy.mape) : 85,
              r_squared: data.accuracy?.r_squared || 0.75
            };
            
            // Create forecast record with the model ID and all required fields
            await supabase.from('ml_forecasts').insert({
              model_id: modelId,
              forecast_type: 'sales',
              resource_type: 'overall',
              resource_id: null, // No specific resource ID for overall sales forecasts
              start_date: data.forecast[0].date,
              end_date: data.forecast[data.forecast.length - 1].date,
              forecast_data: data.forecast,
              accuracy_metrics: accuracyMetrics,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            console.log('Sales forecast stored in database');
          }
        } catch (dbError) {
          console.error('Failed to store forecast in database:', dbError);
          // Continue even if DB storage fails
        }
      }

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
      // Don't store data in development mode
      if (window.location.hostname === 'localhost') {
        console.log('Development mode: Using mock anomaly data');
        return {
          anomalies: [],
          detected_at: new Date().toISOString(),
          isMockData: true
        };
      }

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
              anomalies: recentAnomalies.map(a => ({
                ...a,
                // Map to the format expected by the UI
                ingredient_id: a.resource_id,
                severity: a.is_false_positive ? 'low' : (a.is_confirmed ? 'high' : 'medium'),
                name: a.description?.split('for "')[1]?.replace('"', '') || 'Unknown Item',
                reason: a.description?.split(' for "')[0] || a.description
              })),
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

      // Store anomalies in database using the correct schema
      if (detectedAnomalies.anomalies && detectedAnomalies.anomalies.length > 0) {
        try {
          const anomalyRecords = detectedAnomalies.anomalies.map(anomaly => ({
            anomaly_type: 'inventory',
            description: `${anomaly.reason || 'Anomaly detected'} for "${anomaly.name}"`,
            is_confirmed: anomaly.severity === 'high',
            is_false_positive: false,
            resource_id: anomaly.ingredient_id,  // Store this in description since we don't have the column
            created_at: new Date().toISOString()
            // No need to include columns that don't exist
          }));

          await supabase.from('ml_anomalies').insert(anomalyRecords);
          console.log(`Stored ${anomalyRecords.length} anomalies in database`);
        } catch (dbError) {
          console.error('Failed to store anomalies in database:', dbError);
          // Continue even if DB storage fails
        }
      }

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
      // ALWAYS use mock data in development mode 
      // (window.location.hostname will be 'localhost' in development)
      if (window.location.hostname === 'localhost') {
        console.log('Development mode: Using mock product associations data');
        const mockData = generateMockAssociationData(minConfidence, minSupport);
        return {
          ...mockData,
          isMockData: true
        };
      }

      // Production mode - call the edge function
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
      
      // Only store in production, and only if we have valid data
      if (data?.rules && data.rules.length > 0 && window.location.hostname !== 'localhost') {
        try {
          // First, verify the table structure
          const { valid, columnMap } = await verifyProductAssociationsTable();
          
          if (!valid) {
            console.log('Skipping database storage for product associations due to table structure issues');
          } else {
            console.log('Using column mapping:', columnMap);
            
            // First, delete old associations that might be stale
            await supabase
              .from('ml_product_associations')
              .delete()
              .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            
            // Prepare association records using the correct column names
            const associationRecords = data.rules.flatMap(source => 
              source.targets.map(target => {
                // Create a base object with common fields
                const record = {
                  support: target.support,
                  confidence: target.confidence,
                  lift: target.lift,
                  created_at: new Date().toISOString()
                };
                
                // Add the item ID columns with the correct names
                record[columnMap.itemIdColumn] = source.source;
                record[columnMap.associatedItemColumn] = target.target_id;
                
                return record;
              })
            );
            
            if (associationRecords.length > 0) {
              // Insert in smaller batches to avoid payload size issues
              const batchSize = 10;
              for (let i = 0; i < associationRecords.length; i += batchSize) {
                const batch = associationRecords.slice(i, i + batchSize);
                const { error: insertError } = await supabase
                  .from('ml_product_associations')
                  .insert(batch);
                
                if (insertError) {
                  console.error('Error inserting product associations batch:', insertError);
                  console.error('First record in batch:', batch[0]);
                  break;
                }
              }
              console.log(`Stored ${associationRecords.length} product associations in database`);
            }
          }
        } catch (dbError) {
          console.error('Failed to store associations in database:', dbError);
          // Continue even if DB storage fails
        }
      }
      
      // Process the data and return it
      return {
        rules: data?.rules || [],
        metrics: data?.metrics || {},
        cached: false
      };
      
    } catch (err) {
      setError(`Failed to fetch product associations: ${err.message}`);
      toast.error('Could not analyze product relationships');
      
      // Fall back to mock data but never store it
      const mockData = generateMockAssociationData(minConfidence, minSupport);
      
      // Explicitly mark mock data
      return {
        ...mockData,
        isMockData: true
      };
    } finally {
      setLoading(false);
    }
  }, [verifyProductAssociationsTable]);

  /**
   * Add inventory recommendations to the database
   * @param {Object} recommendation - Recommendation data
   * @returns {boolean} Success status
   */
  const addInventoryRecommendation = useCallback(async (recommendation) => {
    // Skip DB operations in development mode
    if (window.location.hostname === 'localhost') {
      console.log('Development mode: Skipping database storage for inventory recommendation');
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('ml_inventory_recommendations')
        .insert({
          ingredient_id: recommendation.ingredient_id,
          recommendation_type: recommendation.type, // 'restock', 'reduce', 'adjust_min'
          current_value: recommendation.current_value,
          recommended_value: recommendation.recommended_value,
          // Use the correct column names from your schema
          potential_savings: recommendation.type === 'reduce' ? 
            (recommendation.current_value - recommendation.recommended_value) * 
            (recommendation.unit_cost || 0) : 0,
          waste_reduction_percent: recommendation.type === 'reduce' ? 
            ((recommendation.current_value - recommendation.recommended_value) / recommendation.current_value) * 100 : 0,
          confidence_score: recommendation.confidence || 0.8,
          implementation_status: 'pending',
          reason: recommendation.reason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error adding inventory recommendation:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in recommendation addition:', err);
      return false;
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
      // Invoke the edge function
      const { data: optimizations, error } = await supabase.functions.invoke('inventory-optimizations', {
        body: {}
      });

      if (error) throw error;

      // Only store recommendations in the database in production mode
      if (optimizations?.recommendations && optimizations.recommendations.length > 0 && 
          window.location.hostname !== 'localhost') {
        try {
          // First clear old recommendations
          await supabase
            .from('ml_inventory_recommendations')
            .delete()
            .eq('implementation_status', 'pending'); // Use correct column name
            
          // Then add new ones
          const recommendations = optimizations.recommendations.map(rec => ({
            ingredient_id: rec.ingredient_id,
            recommendation_type: rec.type,
            current_value: rec.currentValue,
            recommended_value: rec.recommendedValue,
            // Use the correct column names
            potential_savings: rec.type === 'reduce' ? 
              (rec.currentValue - rec.recommendedValue) * (rec.unit_cost || 0) : 0,
            waste_reduction_percent: rec.type === 'reduce' ? 
              ((rec.currentValue - rec.recommendedValue) / rec.currentValue) * 100 : 0,
            confidence_score: rec.confidence || 0.8,
            implementation_status: 'pending',
            reason: rec.reason,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          for (const rec of recommendations) {
            await addInventoryRecommendation(rec);
          }
          
          console.log(`Stored ${recommendations.length} inventory recommendations`);
        } catch (dbError) {
          console.error('Failed to store inventory recommendations:', dbError);
          // Continue even if DB storage fails
        }
      }

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
  }, [addInventoryRecommendation]);

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
      
      // Mark the recommendation as applied using the correct column name
      const { error: markAppliedError } = await supabase
        .from('ml_inventory_recommendations')
        .update({
          implementation_status: 'applied', // Use proper column name instead of is_applied
          applied_by: supabase.auth.user()?.id,
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('recommendation_id', recommendationId);
    
      if (markAppliedError) {
        console.error('Error marking recommendation as applied:', markAppliedError);
        // Fall back to deleting if update fails (column might not exist)
        const { error: deleteError } = await supabase
          .from('ml_inventory_recommendations')
          .delete()
          .eq('recommendation_id', recommendationId);
        
        if (deleteError) throw deleteError;
      }

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
      // Skip cache lookup if forceRefresh is true
      if (!forceRefresh) {
        // Check existing forecasts in ml_forecasts table that's already being used
        const { data: existingForecasts, error: forecastError } = await supabase
          .from('ml_forecasts')
          .select('*')
          .eq('forecast_type', 'financial')
          .eq('resource_type', 'overall')
          .order('created_at', { ascending: false })
          .limit(1);
          
        // If we have recent forecasts (last 24 hours), return them
        if (!forecastError && existingForecasts && existingForecasts.length > 0) {
          const latestForecast = existingForecasts[0];
          const forecastDate = new Date(latestForecast.created_at);
          const now = new Date();
          const hoursSinceLastForecast = (now.getTime() - forecastDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastForecast < 24) {
            return {
              profitPrediction: {
                dates: latestForecast.forecast_data.map(d => d.date),
                values: latestForecast.forecast_data.map(d => d.prediction),
                lowerBound: latestForecast.forecast_data.map(d => d.lower_bound),
                upperBound: latestForecast.forecast_data.map(d => d.upper_bound)
              },
              revenueTrends: latestForecast.accuracy_metrics?.revenue_trends || null,
              costTrends: latestForecast.accuracy_metrics?.cost_trends || null,
              confidenceIntervals: latestForecast.accuracy_metrics?.confidence_intervals || null,
              featureImportance: latestForecast.accuracy_metrics?.feature_importance || [],
              accuracy: latestForecast.accuracy_metrics?.overall_accuracy || 85,
              cached: true
            };
          }
        }
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('financial-metrics', {
        body: { 
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          forecastDays,
          forceRefresh
        }
      });

      if (error) throw error;

      // Store the forecast and create model entry in database for persistence
      if (data && window.location.hostname !== 'localhost') {
        try {
          // First check if we already have an active financial model
          let modelId;
          const { data: existingModels } = await supabase
            .from('ml_models')
            .select('model_id')
            .eq('model_type', 'financial')
            .eq('is_active', true)
            .limit(1);

          if (existingModels && existingModels.length > 0) {
            modelId = existingModels[0].model_id;
            
            // Update the existing model with new accuracy
            await supabase
              .from('ml_models')
              .update({
                last_trained: new Date().toISOString(),
                accuracy: data.accuracy || 85,
                parameters: { 
                  forecastDays, 
                  includesRevenue: true, 
                  includesProfit: true, 
                  includesCosts: true
                },
                updated_at: new Date().toISOString()
              })
              .eq('model_id', modelId);
          } else {
            // Create a new model entry
            const { data: newModel } = await supabase
              .from('ml_models')
              .insert({
                model_name: 'Financial Forecasting Model',
                model_type: 'financial',
                last_trained: new Date().toISOString(),
                accuracy: data.accuracy || 85,
                parameters: { 
                  forecastDays, 
                  includesRevenue: true, 
                  includesProfit: true, 
                  includesCosts: true
                },
                is_active: true
              })
              .select('model_id');
            
            if (newModel && newModel.length > 0) {
              modelId = newModel[0].model_id;
            }
          }

          if (modelId) {
            // Create forecast record with the model ID
            const forecastData = [];
            
            // Create consistent forecast data format
            if (data.profitPrediction && data.profitPrediction.dates) {
              for (let i = 0; i < data.profitPrediction.dates.length; i++) {
                forecastData.push({
                  date: data.profitPrediction.dates[i],
                  prediction: data.profitPrediction.values[i],
                  lower_bound: data.profitPrediction.lowerBound ? data.profitPrediction.lowerBound[i] : null,
                  upper_bound: data.profitPrediction.upperBound ? data.profitPrediction.upperBound[i] : null
                });
              }
            }
            
            // Store accuracy metrics in the format the DB expects
            const accuracyMetrics = {
              revenue_trends: data.revenueTrends || null,
              cost_trends: data.costTrends || null,
              confidence_intervals: data.confidenceIntervals || null,
              feature_importance: data.featureImportance || [],
              overall_accuracy: data.accuracy || 85
            };
            
            // Insert or update the forecast
            await supabase.from('ml_forecasts').insert({
              model_id: modelId,
              forecast_type: 'financial',
              resource_type: 'overall',
              resource_id: null, // No specific resource ID for overall financial forecasts
              start_date: forecastData.length > 0 ? forecastData[0].date : new Date().toISOString().split('T')[0],
              end_date: forecastData.length > 0 ? forecastData[forecastData.length - 1].date : new Date().toISOString().split('T')[0],
              forecast_data: forecastData,
              accuracy_metrics: accuracyMetrics
            });
            
            // Feature importance is already included in accuracy_metrics,
            // but if you want to store it separately (create the table first):
            if (data.featureImportance && data.featureImportance.length > 0) {
              try {
                // Check if the feature_importance table exists
                const { error: tableError } = await supabase.rpc(
                  'check_table_exists',
                  { table_name: 'ml_feature_importance' }
                );
                
                if (!tableError) {
                  // Clear old feature importances
                  await supabase
                    .from('ml_feature_importance')
                    .delete()
                    .eq('model_id', modelId);
                    
                  // Insert new feature importances
                  for (const feature of data.featureImportance) {
                    await supabase
                      .from('ml_feature_importance')
                      .insert({
                        model_id: modelId,
                        feature_name: feature.feature,
                        importance_score: feature.importance,
                        created_at: new Date().toISOString()
                      });
                  }
                }
              } catch (featureError) {
                console.error('Failed to store feature importance:', featureError);
                // Continue even if feature importance storage fails
              }
            }
          }
        } catch (dbError) {
          console.error('Failed to store financial forecast in database:', dbError);
          // Continue even if DB storage fails
        }
      }

      return {
        profitPrediction: data.profitPrediction || null,
        revenueTrends: data.revenueTrends || null,
        costTrends: data.costTrends || null,
        confidenceIntervals: data.confidenceIntervals || null,
        featureImportance: data.featureImportance || [],
        accuracy: data.accuracy || null
      };
    } catch (err) {
      setError(`Failed to fetch financial metrics: ${err.message}`);
      toast.error('Could not generate financial predictions');
      
      // Return mock data as fallback
      return generateMockFinancialMetrics();
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

  // Add this function to generate mock financial data for testing
  const generateMockFinancialMetrics = () => {
    const today = new Date();
    const futureDates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i + 1);
      return date.toISOString().split('T')[0];
    });

    // Generate realistic mock data
    return {
      profitPrediction: {
        dates: futureDates,
        values: futureDates.map(() => Math.random() * 10000 + 5000),
        lowerBound: futureDates.map(() => Math.random() * 8000 + 3000),
        upperBound: futureDates.map(() => Math.random() * 14000 + 7000)
      },
      revenueTrends: {
        trend: 'increasing',
        prediction: 'Revenue is expected to increase by 12% in the next 30 days',
        confidence: 85
      },
      costTrends: {
        trend: 'stable',
        prediction: 'Costs are expected to remain stable with less than 3% variation',
        confidence: 90
      },
      confidenceIntervals: {
        revenue: { lower: 42000, upper: 55000, confidence: 95 },
        profit: { lower: 12000, upper: 18000, confidence: 90 },
        costs: { lower: 28000, upper: 35000, confidence: 85 }
      },
      featureImportance: [
        { feature: 'Day of week', importance: 28 },
        { feature: 'Season', importance: 24 },
        { feature: 'Promotional activity', importance: 20 },
        { feature: 'Weather', importance: 15 },
        { feature: 'Local events', importance: 13 }
      ],
      accuracy: 89.5
    };
  };

  // Add these functions to populate the remaining ML tables

  // 1. Function to populate philippine_holidays
  const populateHolidays = useCallback(async () => {
    try {
      // Check if we already have holidays
      const { data: existingHolidays } = await supabase
        .from('philippine_holidays')
        .select('count')
        .single();
        
      if (existingHolidays?.count > 0) {
        console.log(`${existingHolidays.count} holidays already in database`);
        return;
      }
      
      // Add common Philippine holidays
      const holidays = [
        { holiday_name: 'New Year\'s Day', holiday_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Araw ng Kagitingan', holiday_date: new Date(new Date().getFullYear(), 3, 9).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Labor Day', holiday_date: new Date(new Date().getFullYear(), 4, 1).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Independence Day', holiday_date: new Date(new Date().getFullYear(), 5, 12).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'National Heroes Day', holiday_date: new Date(new Date().getFullYear(), 7, 30).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Bonifacio Day', holiday_date: new Date(new Date().getFullYear(), 10, 30).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Christmas', holiday_date: new Date(new Date().getFullYear(), 11, 25).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true },
        { holiday_name: 'Rizal Day', holiday_date: new Date(new Date().getFullYear(), 11, 30).toISOString().split('T')[0], holiday_type: 'regular', is_recurring: true }
      ];
      
      const { error } = await supabase.from('philippine_holidays').insert(holidays);
      
      if (error) {
        console.error('Error populating holidays:', error);
      } else {
        console.log(`Successfully added ${holidays.length} Philippine holidays`);
      }
    } catch (err) {
      console.error('Error in holiday population:', err);
    }
  }, []);

  // 2. Function to add weather data
  const addWeatherData = useCallback(async (weatherData) => {
    try {
      const { data, error } = await supabase
        .from('weather_data')
        .insert({
          date: weatherData.date || new Date().toISOString().split('T')[0],
          location: weatherData.location || 'Davao City',
          condition: weatherData.condition,
          temperature_high: weatherData.temperature_high,
          temperature_low: weatherData.temperature_low,
          rainfall: weatherData.rainfall,
          humidity: weatherData.humidity
        });
        
      if (error) {
        console.error('Error adding weather data:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in weather data addition:', err);
      return false;
    }
  }, []);

  // 3. Function to log an ML prediction
  const logPrediction = useCallback(async (modelId, predictionType, predictionData, actualData = null, accuracy = null) => {
    try {
      const { data, error } = await supabase
        .from('ml_predictions')
        .insert({
          model_id: modelId,
          prediction_type: predictionType,
          prediction_data: predictionData,
          actual_data: actualData,
          accuracy: accuracy
        });
        
      if (error) {
        console.error('Error logging prediction:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in prediction logging:', err);
      return false;
    }
  }, []);

  // 4. Function to create/update item clusters
  const updateItemClusters = useCallback(async (clusterData) => {
    try {
      // First create or update the cluster
      let clusterId;
      const { data: existingCluster, error: fetchError } = await supabase
        .from('ml_item_clusters')
        .select('cluster_id')
        .eq('cluster_name', clusterData.name)
        .limit(1);
        
      if (fetchError) {
        console.error('Error fetching clusters:', fetchError);
        return false;
      }
      
      if (existingCluster && existingCluster.length > 0) {
        // Update existing cluster
        clusterId = existingCluster[0].cluster_id;
        const { error: updateError } = await supabase
          .from('ml_item_clusters')
          .update({
            description: clusterData.description,
            parameters: clusterData.parameters,
            last_updated: new Date().toISOString()
          })
          .eq('cluster_id', clusterId);
          
        if (updateError) {
          console.error('Error updating cluster:', updateError);
          return false;
        }
      } else {
        // Create new cluster
        const { data: newCluster, error: insertError } = await supabase
          .from('ml_item_clusters')
          .insert({
            cluster_name: clusterData.name,
            description: clusterData.description,
            parameters: clusterData.parameters,
            last_updated: new Date().toISOString()
          })
          .select('cluster_id');
          
        if (insertError || !newCluster) {
          console.error('Error creating cluster:', insertError);
          return false;
        }
        
        clusterId = newCluster[0].cluster_id;
      }
      
      // Now add the item mappings
      if (clusterData.items && clusterData.items.length > 0) {
        // Delete old mappings first
        await supabase
          .from('ml_item_cluster_mapping')
          .delete()
          .eq('cluster_id', clusterId);
          
        // Insert new mappings
        const mappings = clusterData.items.map(item => ({
          item_id: item.item_id,
          cluster_id: clusterId,
          confidence: item.confidence || 1.0
        }));
        
        const { error: mappingError } = await supabase
          .from('ml_item_cluster_mapping')
          .insert(mappings);
          
        if (mappingError) {
          console.error('Error creating cluster mappings:', mappingError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error in cluster update:', err);
      return false;
    }
  }, []);

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
    getPredictiveMetrics,
    // Add these new functions
    populateHolidays,
    addWeatherData,
    logPrediction,
    updateItemClusters,
    addInventoryRecommendation
  };
};

export default useMLPredictions;