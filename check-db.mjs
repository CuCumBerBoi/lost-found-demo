import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDB() {
  console.log("=== Checking claims columns ===");
  const { data: claims, error } = await supabase.from("claims").select("claim_id, status").limit(5);
  console.log("claims error:", error?.message);
  console.log("claims:", JSON.stringify(claims, null, 2));

  console.log("\n=== Checking categories columns ===");
  const { data: cats, error: catErr } = await supabase.from("categories").select("category_id, name").limit(5);
  console.log("categories error:", catErr?.message);
  console.log("categories:", JSON.stringify(cats, null, 2));
  
  console.log("\n=== Check if found_items has category_id ===");
  const { data: fi } = await supabase.from("found_items").select("found_id, category_id").limit(3);
  console.log("found_items category_id:", JSON.stringify(fi, null, 2));

  console.log("\n=== Checking users table structure ===");
  const { data: users, error: userErr } = await supabase.from("users").select("user_id, full_name, role, created_at").limit(3);
  console.log("users error:", userErr?.message);
  console.log("users:", JSON.stringify(users, null, 2));
}

checkDB();
