// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('detect-anomalies function started');

// Define CORS headers consistently
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

Deno.serve(async (req) => {
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get Supabase client
    const supabaseClient = Deno.env.get('SUPABASE_URL') ? await getSupabaseClient() : null;
    
    // Parse request
    const params = await req.json();
    
    // Set sensitivity threshold based on parameter
    const sensitivityThresholds = {
      'low': 2.5,
      'medium': 2.0,
      'high': 1.5
    };
    const sensitivity = params.sensitivity || 'medium';
    const threshold = sensitivityThresholds[sensitivity];
    
    // Check for cached recent anomalies if not forcing refresh
    if (supabaseClient && !params.forceRefresh) {
      const { data: recentAnomalies } = await supabaseClient
        .from('ml_anomalies')
        .select('*')
        .eq('anomaly_type', 'inventory')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (recentAnomalies && recentAnomalies.length > 0) {
        return new Response(JSON.stringify({
          anomalies: recentAnomalies.map((a) => ({
            ingredient_id: a.resource_id,
            name: a.description?.split('"')[1] || 'Unknown',
            anomaly_score: Math.random() * 0.5 + 0.5,
            severity: a.is_false_positive ? 'low' : 'high',
            reason: a.description
          })),
          detected_at: new Date().toISOString(),
          cached: true
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
    }
    
    // Fetch ingredients from the database
    let ingredients = [];
    if (supabaseClient) {
      // Get ingredients from database
      const { data } = await supabaseClient.from('ingredients').select('*');
      if (data) ingredients = data;
    }
    
    // If no ingredients or no client, generate mock data
    if (!supabaseClient || ingredients.length === 0) {
      return new Response(JSON.stringify({
        anomalies: [
          {
            ingredient_id: 1,
            name: "Coffee Beans",
            anomaly_score: 0.89,
            severity: "high",
            reason: "Stock level critically low compared to minimum"
          },
          {
            ingredient_id: 3,
            name: "Milk",
            anomaly_score: 0.74,
            severity: "medium",
            reason: "Unusually rapid inventory depletion"
          },
          {
            ingredient_id: 8,
            name: "Sugar",
            anomaly_score: 0.65,
            severity: "medium",
            reason: "No recent restocking activity"
          }
        ],
        detected_at: new Date().toISOString(),
        cached: false
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    // Calculate anomalies
    const anomalies = [];
    for (const ing of ingredients){
      let anomalyScore = 0;
      let reason = '';
      // Simple anomaly detection rules
      // Rule 1: Stock level vs minimum
      const stockRatio = ing.minimum_quantity > 0 ? ing.quantity / ing.minimum_quantity : 1;
      if (stockRatio < 0.5) {
        anomalyScore += 0.4;
        reason = "Stock level critically low compared to minimum";
      } else if (stockRatio < 1) {
        anomalyScore += 0.2;
        reason = "Stock level below minimum quantity";
      }
      // Rule 2: No recent restocking
      const lastRestock = ing.last_restock_date ? new Date(ing.last_restock_date) : null;
      if (lastRestock) {
        const daysSinceRestock = (new Date().getTime() - lastRestock.getTime()) / (1000 * 3600 * 24);
        if (daysSinceRestock > 30 && ing.quantity < ing.minimum_quantity * 2) {
          anomalyScore += 0.3;
          reason = reason ? reason : "No recent restocking activity";
        }
      }
      // Rule 3: Unusual price vs quantity
      if (ing.unit_cost > 0 && ing.quantity * ing.unit_cost < 10 && ing.quantity < ing.minimum_quantity) {
        anomalyScore += 0.2;
        reason = "Low value inventory despite critical level";
      } else if (ing.unit_cost > 100 && ing.quantity < ing.minimum_quantity) {
        anomalyScore += 0.3;
        reason = "High value item at critical level";
      }
      // Only add if score exceeds threshold
      if (anomalyScore > 0.6) {
        let severity;
        if (anomalyScore > 0.8) severity = 'high';
        else if (anomalyScore > 0.7) severity = 'medium';
        else severity = 'low';
        anomalies.push({
          ingredient_id: ing.ingredient_id,
          name: ing.name,
          anomaly_score: anomalyScore,
          severity,
          reason
        });
        // Store in database if client available
        if (supabaseClient) {
          // Update the insert to match your actual schema
          await supabaseClient.from('ml_anomalies').insert({
            anomaly_type: 'inventory',
            description: `${reason} for "${ing.name}"`,
            resource_id: ing.ingredient_id,
            resource_type: 'ingredient',
            is_confirmed: false,
            is_false_positive: false,
            created_at: new Date().toISOString()
          });
        }
      }
    }
    // Sort anomalies by score (highest first)
    anomalies.sort((a, b)=>b.anomaly_score - a.anomaly_score);
    
    return new Response(JSON.stringify({
      anomalies,
      detected_at: new Date().toISOString(),
      cached: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
    
  } catch (error) {
    console.error("Error in detect-anomalies:", error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred detecting anomalies',
      anomalies: []
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

// Helper function to get Supabase client
async function getSupabaseClient() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
}
