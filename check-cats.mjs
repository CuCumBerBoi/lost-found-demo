import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzemoaynhgbiobhxqjqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZW1vYXluaGdiaW9iaHhxanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzU5MzgsImV4cCI6MjA4NDA1MTkzOH0.CnRUrb_r2yHam4cEmirWF4p2nKuGK6lb_0I1fApokHU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCategories() {
  console.log("Fetching categories from Supabase...");
  const { data, error } = await supabase.from('categories').select('*');
  
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log(`Found ${data.length} categories.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCategories();
