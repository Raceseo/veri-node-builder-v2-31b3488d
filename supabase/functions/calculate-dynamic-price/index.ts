import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceFactors {
  baseValue: number;
  demandFactor: number;
  scarcityFactor: number;
  qualityFactor: number;
  freshnessBonus: number;
  finalPrice: number;
}

interface CategoryStats {
  category: string;
  totalSuppliers: number;
  activeRequests: number;
  demandFactor: number;
  scarcityFactor: number;
  baseValue: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, categories, userId, trustScore } = await req.json();

    if (action === 'get_prices') {
      // Get current market prices for categories
      const { data: categoryValues, error } = await supabase
        .from('data_category_values')
        .select('*')
        .in('category', categories || []);

      if (error) throw error;

      const prices = categoryValues?.map((cv) => ({
        category: cv.category,
        displayName: cv.display_name,
        baseValue: cv.base_value,
        demandFactor: cv.current_demand_factor,
        scarcityFactor: cv.current_scarcity_factor,
        totalSuppliers: cv.total_suppliers,
        activeRequests: cv.active_requests,
        currentPrice: calculatePrice(cv.base_value, cv.current_demand_factor, cv.current_scarcity_factor),
      })) || [];

      return new Response(JSON.stringify({ prices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'calculate_user_data_value') {
      // Calculate total data value for a user based on their categories
      const { data: categoryValues, error } = await supabase
        .from('data_category_values')
        .select('*')
        .in('category', categories || []);

      if (error) throw error;

      let totalValue = 0;
      const breakdown: PriceFactors[] = [];

      for (const cv of categoryValues || []) {
        const basePrice = calculatePrice(
          cv.base_value,
          cv.current_demand_factor,
          cv.current_scarcity_factor
        );

        // Apply quality factor based on trust score
        const qualityFactor = calculateQualityFactor(trustScore || 65);
        
        // Apply freshness bonus (newer data is more valuable)
        const freshnessBonus = 1.0; // Can be adjusted based on last update time

        const finalPrice = Math.round(basePrice * qualityFactor * freshnessBonus);

        totalValue += finalPrice;
        breakdown.push({
          baseValue: cv.base_value,
          demandFactor: cv.current_demand_factor,
          scarcityFactor: cv.current_scarcity_factor,
          qualityFactor,
          freshnessBonus,
          finalPrice,
        });
      }

      return new Response(JSON.stringify({ 
        totalValue,
        breakdown,
        categoryCount: categories?.length || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_market_factors') {
      // Update demand/scarcity factors based on market activity
      // This would typically be called by a scheduled job

      const { data: allCategories, error: fetchError } = await supabase
        .from('data_category_values')
        .select('*');

      if (fetchError) throw fetchError;

      const updates: CategoryStats[] = [];

      for (const category of allCategories || []) {
        // Get recent purchase activity for this category
        const { count: recentPurchases } = await supabase
          .from('data_purchases')
          .select('*', { count: 'exact', head: true })
          .eq('product_type', category.category)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // Get supplier count for this category
        const { count: supplierCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .contains('data_categories', [category.category]);

        // Calculate new factors
        const activeRequests = recentPurchases || 0;
        const totalSuppliers = supplierCount || 0;

        // Demand factor: more requests = higher price (1.0 to 2.0)
        const demandFactor = Math.min(2.0, 1.0 + (activeRequests / 100));

        // Scarcity factor: fewer suppliers = higher price (1.0 to 2.0)
        const scarcityFactor = totalSuppliers > 0 
          ? Math.min(2.0, 1.0 + (1 / Math.log10(totalSuppliers + 1)))
          : 1.5;

        // Update the category
        const { error: updateError } = await supabase
          .from('data_category_values')
          .update({
            current_demand_factor: demandFactor,
            current_scarcity_factor: scarcityFactor,
            total_suppliers: totalSuppliers,
            active_requests: activeRequests,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', category.id);

        if (updateError) {
          console.error(`Failed to update category ${category.category}:`, updateError);
        } else {
          updates.push({
            category: category.category,
            totalSuppliers,
            activeRequests,
            demandFactor,
            scarcityFactor,
            baseValue: category.base_value,
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        updatedCategories: updates.length,
        updates,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculatePrice(baseValue: number, demandFactor: number, scarcityFactor: number): number {
  return Math.round(baseValue * demandFactor * scarcityFactor);
}

function calculateQualityFactor(trustScore: number): number {
  // Trust score 0-100 maps to quality factor 0.8 to 1.5
  if (trustScore >= 90) return 1.5;
  if (trustScore >= 80) return 1.3;
  if (trustScore >= 70) return 1.15;
  if (trustScore >= 60) return 1.0;
  if (trustScore >= 50) return 0.9;
  return 0.8;
}
