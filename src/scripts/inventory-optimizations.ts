// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('inventory-optimizations function started');

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
    
    // Check for cached recent recommendations
    if (supabaseClient) {
      const { data: recentRecommendations } = await supabaseClient
        .from('ml_inventory_recommendations')
        .select('*, ingredients!inner(*)')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
        
      if (recentRecommendations && recentRecommendations.length > 0) {
        const formattedRecommendations = recentRecommendations.map((rec) => ({
          ingredient_id: rec.ingredient_id,
          ingredient: {
            name: rec.ingredients?.name || 'Unknown',
            unit: rec.ingredients?.unit || 'unit'
          },
          recommendation_type: rec.recommendation_type,
          currentValue: rec.current_value,
          recommendedValue: rec.recommended_value,
          confidence: rec.confidence,
          reason: rec.reason
        }));
        
        // Calculate savings and waste reduction
        const potentialSavings = formattedRecommendations.reduce((sum, rec) => {
          if (rec.recommendation_type === 'reduce') {
            const reducedUnits = rec.currentValue - rec.recommendedValue;
            const unitCost = rec.ingredients?.unit_cost || 0;
            return sum + reducedUnits * unitCost;
          }
          return sum;
        }, 0);
        
        const wasteReduction = formattedRecommendations.reduce((sum, rec) => {
          if (rec.recommendation_type === 'reduce') {
            return sum + (rec.currentValue - rec.recommendedValue);
          }
          return sum;
        }, 0);
        
        return new Response(JSON.stringify({
          recommendations: formattedRecommendations,
          potentialSavings,
          wasteReduction,
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
    
    // If we reach here, either no cached data or no client
    let ingredients = [];
    if (supabaseClient) {
      // Get ingredients from database
      const { data } = await supabaseClient.from('ingredients').select('*');
      if (data) ingredients = data;
    }
    
    // If no ingredients or no client, generate mock data
    if (ingredients.length === 0) {
      return new Response(JSON.stringify({
        recommendations: [
          {
            ingredient_id: 1,
            ingredient: {
              name: "Coffee Beans",
              unit: "kg"
            },
            recommendation_type: "restock",
            currentValue: 2.5,
            recommendedValue: 10,
            confidence: 0.92,
            reason: "Stock level below minimum threshold. Place order soon."
          },
          {
            ingredient_id: 5,
            ingredient: {
              name: "Chocolate Syrup",
              unit: "bottles"
            },
            recommendation_type: "reduce",
            currentValue: 25,
            recommendedValue: 15,
            confidence: 0.85,
            reason: "Excess inventory detected. Consider reducing ordering volume."
          },
          {
            ingredient_id: 8,
            ingredient: {
              name: "Sugar",
              unit: "kg"
            },
            recommendation_type: "adjust_min",
            currentValue: 50,
            recommendedValue: 35,
            confidence: 0.78,
            reason: "Current minimum quantity may need adjustment based on usage patterns."
          }
        ],
        potentialSavings: 1250.75,
        wasteReduction: 12.5,
        cached: false
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    
    // Generate recommendations
    const recommendations = [];
    let potentialSavings = 0;
    let wasteReduction = 0;
    
    for (const ing of ingredients) {
      // Skip ingredients with no data
      if (ing.quantity === null || ing.minimum_quantity === null || ing.unit_cost === null) {
        continue;
      }
      
      // Case 1: Low stock recommendation
      if (ing.quantity < ing.minimum_quantity * 0.8) {
        const recommendedValue = ing.minimum_quantity * 1.5;
        recommendations.push({
          ingredient_id: ing.ingredient_id,
          ingredient: {
            name: ing.name,
            unit: ing.unit
          },
          recommendation_type: 'restock',
          currentValue: ing.quantity,
          recommendedValue: recommendedValue,
          confidence: 0.9,
          reason: "Stock level below minimum threshold. Place order soon."
        });
        
        // Store recommendation if client available
        if (supabaseClient) {
          await supabaseClient.from('ml_inventory_recommendations').insert({
            ingredient_id: ing.ingredient_id,
            recommendation_type: 'restock',
            current_value: ing.quantity,
            recommended_value: recommendedValue,
            confidence: 0.9,
            reason: "Stock level below minimum threshold. Place order soon."
          });
        }
      } else if (ing.quantity > ing.minimum_quantity * 3 && ing.quantity > 20) {
        const recommendedValue = ing.minimum_quantity * 2;
        const saving = (ing.quantity - recommendedValue) * ing.unit_cost;
        
        recommendations.push({
          ingredient_id: ing.ingredient_id,
          ingredient: {
            name: ing.name,
            unit: ing.unit
          },
          recommendation_type: 'reduce',
          currentValue: ing.quantity,
          recommendedValue: recommendedValue,
          confidence: 0.85,
          reason: "Excess inventory detected. Consider reducing ordering volume."
        });
        
        potentialSavings += saving;
        wasteReduction += ing.quantity - recommendedValue;
        
        // Store recommendation if client available
        if (supabaseClient) {
          await supabaseClient.from('ml_inventory_recommendations').insert({
            ingredient_id: ing.ingredient_id,
            recommendation_type: 'reduce',
            current_value: ing.quantity,
            recommended_value: recommendedValue,
            confidence: 0.85,
            reason: "Excess inventory detected. Consider reducing ordering volume."
          });
        }
      } else if (ing.minimum_quantity < 1 || ing.minimum_quantity > 50 && ing.quantity < ing.minimum_quantity * 0.5) {
        // If minimum quantity seems too low or too high
        let recommendedValue;
        if (ing.minimum_quantity < 1) {
          recommendedValue = 5; // Reasonable minimum
        } else {
          recommendedValue = ing.minimum_quantity * 0.7;
        }
        
        recommendations.push({
          ingredient_id: ing.ingredient_id,
          ingredient: {
            name: ing.name,
            unit: ing.unit
          },
          recommendation_type: 'adjust_min',
          currentValue: ing.minimum_quantity,
          recommendedValue: recommendedValue,
          confidence: 0.75,
          reason: "Current minimum quantity may need adjustment based on usage patterns."
        });
        
        // Store recommendation if client available
        if (supabaseClient) {
          await supabaseClient.from('ml_inventory_recommendations').insert({
            ingredient_id: ing.ingredient_id,
            recommendation_type: 'adjust_min',
            current_value: ing.minimum_quantity,
            recommended_value: recommendedValue,
            confidence: 0.75,
            reason: "Current minimum quantity may need adjustment based on usage patterns."
          });
        }
      }
    }
    
    // Return results
    return new Response(JSON.stringify({
      recommendations,
      potentialSavings,
      wasteReduction,
      cached: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
    
  } catch (error) {
    console.error("Error in inventory-optimizations:", error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred generating inventory optimizations',
      recommendations: []
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
