import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kzemoaynhgbiobhxqjqc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZW1vYXluaGdiaW9iaHhxanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzU5MzgsImV4cCI6MjA4NDA1MTkzOH0.CnRUrb_r2yHam4cEmirWF4p2nKuGK6lb_0I1fApokHU'
);

(async () => {
  const { data, error } = await supabase.from('categories').insert({ name: 'test_category_123' }).select().single();
  console.log('DATA:', data);
  console.log('ERROR:', JSON.stringify(error, null, 2));
})();
