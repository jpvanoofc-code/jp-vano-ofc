import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { supplier_id } = await req.json();
    if (!supplier_id) {
      return new Response(JSON.stringify({ error: "supplier_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get supplier credentials
    const { data: supplier, error: supError } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplier_id)
      .eq("platform", "nuvemshop")
      .single();

    if (supError || !supplier) {
      return new Response(JSON.stringify({ error: "Supplier not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = JSON.parse(supplier.access_token || "{}");
    const { storeUrl, accessToken } = credentials;

    if (!storeUrl || !accessToken) {
      return new Response(JSON.stringify({ error: "Missing Nuvemshop credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize store URL - extract store ID or use API
    // Nuvemshop API: https://api.nuvemshop.com.br/v1/{store_id}/products
    // Or Tiendanube API: https://api.tiendanube.com/v1/{store_id}/products
    // The user provides the store URL, we need the store ID
    // First, let's try to get store info using the authentication endpoint
    
    const storeId = credentials.storeId || await getStoreId(storeUrl, accessToken);
    
    if (!storeId) {
      return new Response(JSON.stringify({ error: "Could not determine store ID. Please provide the Store ID in the store URL field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch products from Nuvemshop API
    const apiUrl = `https://api.tiendanube.com/v1/${storeId}/products?per_page=50`;
    const nuvemResponse = await fetch(apiUrl, {
      headers: {
        "Authentication": `bearer ${accessToken}`,
        "User-Agent": "JPvano (jpvanoofc@gmail.com)",
        "Content-Type": "application/json",
      },
    });

    if (!nuvemResponse.ok) {
      const errText = await nuvemResponse.text();
      console.error("Nuvemshop API error:", nuvemResponse.status, errText);
      
      // Log the sync failure
      await supabase.from("sync_logs").insert({
        supplier_id,
        user_id: userId,
        action: "sync_products",
        status: "error",
        details: `Nuvemshop API error [${nuvemResponse.status}]: ${errText.substring(0, 500)}`,
      });

      return new Response(JSON.stringify({ 
        error: `Nuvemshop API error: ${nuvemResponse.status}`,
        details: errText.substring(0, 200),
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nuvemProducts = await nuvemResponse.json();
    
    // Calculate margin
    const marginType = supplier.profit_margin_type;
    const marginValue = supplier.profit_margin_value;

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const product of nuvemProducts) {
      try {
        const firstVariant = product.variants?.[0];
        const originalPrice = parseFloat(firstVariant?.price || product.price || "0");
        
        let sellingPrice = originalPrice;
        if (marginType === "percentage") {
          sellingPrice = originalPrice * (1 + marginValue / 100);
        } else {
          sellingPrice = originalPrice + marginValue;
        }

        const imageUrls = (product.images || []).map((img: any) => img.src);
        const productName = product.name?.pt || product.name?.es || product.name?.en || product.name || "Sem nome";
        const productDesc = product.description?.pt || product.description?.es || product.description?.en || product.description || "";
        const stock = firstVariant?.stock || 0;

        const productData = {
          external_id: String(product.id),
          supplier_id,
          user_id: userId,
          title: productName,
          description: productDesc.replace(/<[^>]*>/g, "").substring(0, 2000),
          original_price: originalPrice,
          selling_price: Math.round(sellingPrice * 100) / 100,
          stock: stock === null ? 999 : stock,
          image_urls: imageUrls,
          external_url: product.canonical_url || `${storeUrl}/produtos/${product.handle?.pt || product.id}`,
          category: product.categories?.[0]?.name?.pt || product.categories?.[0]?.name?.es || null,
          status: "active",
          last_synced_at: new Date().toISOString(),
          metadata: {
            variants: product.variants?.length || 0,
            handle: product.handle?.pt || product.handle,
            brand: product.brand,
          },
        };

        // Upsert - update if exists, insert if not
        const { data: existing } = await supabase
          .from("imported_products")
          .select("id")
          .eq("external_id", String(product.id))
          .eq("supplier_id", supplier_id)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await supabase
            .from("imported_products")
            .update(productData)
            .eq("id", existing.id);
          if (updateErr) throw updateErr;
          updated++;
        } else {
          const { error: insertErr } = await supabase
            .from("imported_products")
            .insert(productData);
          if (insertErr) throw insertErr;
          imported++;
        }
      } catch (e) {
        console.error("Error processing product:", product.id, e);
        errors++;
      }
    }

    // Update supplier last_sync_at
    await supabase
      .from("suppliers")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", supplier_id);

    // Log success
    await supabase.from("sync_logs").insert({
      supplier_id,
      user_id: userId,
      action: "sync_products",
      status: "success",
      products_affected: imported + updated,
      details: `Importados: ${imported}, Atualizados: ${updated}, Erros: ${errors}, Total da API: ${nuvemProducts.length}`,
    });

    return new Response(JSON.stringify({
      success: true,
      imported,
      updated,
      errors,
      total: nuvemProducts.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getStoreId(storeUrl: string, accessToken: string): Promise<string | null> {
  try {
    // Try to extract store ID from URL if it's numeric
    const urlParts = storeUrl.replace(/\/$/, "").split("/");
    const lastPart = urlParts[urlParts.length - 1];
    if (/^\d+$/.test(lastPart)) return lastPart;

    // Try the store info endpoint
    const res = await fetch("https://api.tiendanube.com/v1/store", {
      headers: {
        "Authentication": `bearer ${accessToken}`,
        "User-Agent": "JPvano (jpvanoofc@gmail.com)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      return String(data.id);
    }
    await res.text(); // consume body
    return null;
  } catch {
    return null;
  }
}
