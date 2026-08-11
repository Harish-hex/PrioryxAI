const { createClient } = require('@supabase/supabase-js')

const url = 'https://wgvswyatbrdggrdadqss.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg4ODI0OCwiZXhwIjoyMDkxNDY0MjQ4fQ.lM4ygKTqjk5n3EEaBxrhlE95Pr_ZHmqmO0GuqIjgF6g'

const supabase = createClient(url, key)

async function checkLC() {
  const { data, error } = await supabase.from('leetcode_profiles').select('id').limit(1)
  console.log("Error:", error)
}
checkLC()
