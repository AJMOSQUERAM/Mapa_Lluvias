import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const CENICANA_AUTH_URL = "https://api.cenicana.org/usuarios/sessions/";
const CENICANA_DATA_URL = "https://api.cenicana.org/geomatica/transitabilidad/transitabilidad-ingenio/";

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const email = Deno.env.get("CENICANA_EMAIL");
    const password = Deno.env.get("CENICANA_PASSWORD");

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing Cenicana credentials" }), { status: 500 });
    }

    console.log("Authenticating with Cenicaña...");
    const loginRes = await fetch(CENICANA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) throw new Error("Cenicana Login failed");
    const { token } = await loginRes.json();

    console.log("Fetching data for ingenio PR...");
    const dataRes = await fetch(CENICANA_DATA_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ing: "PR" }),
    });

    if (!dataRes.ok) throw new Error("Cenicana Data fetch failed");
    const geojson = await dataRes.json();

    const features = geojson.features;
    console.log(`Processing ${features.length} features...`);

    for (const feature of features) {
      const { properties, geometry } = feature;
      const cod_unico = properties.cod_unico;

      // 1. Upsert Lot (Geometry and info)
      const { error: lotError } = await supabaseClient
        .from("lots")
        .upsert({
          id: cod_unico,
          hda: properties.hda,
          ste: properties.ste,
          nombre_hda: properties.nombre_hda,
          geom: geometry // PostGIS handles GeoJSON objects directly in upsert if configured properly or using RPC
        }, { onConflict: "id" });

      if (lotError) console.error(`Error upserting lot ${cod_unico}:`, lotError);

      // 2. Insert Metric
      const { error: metricError } = await supabaseClient
        .from("rainfall_metrics")
        .upsert({
          lot_id: cod_unico,
          date: properties.fecha,
          rain_daily: properties.rain,
          rain_5d: properties.rain_acumulada_5d
        }, { onConflict: "lot_id,date" });

      if (metricError) console.error(`Error inserting metric for ${cod_unico}:`, metricError);
    }

    return new Response(JSON.stringify({ message: "Sync completed", count: features.length }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
