const { createClient } = require('@supabase/supabase-js');
const url = 'https://wgvswyatbrdggrdadqss.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg4ODI0OCwiZXhwIjoyMDkxNDY0MjQ4fQ.lM4ygKTqjk5n3EEaBxrhlE95Pr_ZHmqmO0GuqIjgF6g';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('daily_plans').delete().neq('user_id', '12345678-1234-1234-1234-123456789012');
  console.log('Deleted plans:', error || 'Success');
  
  const { data: d2, error: e2 } = await supabase.from('priority_tasks').delete().neq('user_id', '12345678-1234-1234-1234-123456789012');
  console.log('Deleted tasks:', e2 || 'Success');
}

run();
