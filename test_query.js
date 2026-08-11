const { createClient } = require('@supabase/supabase-js')

const url = 'https://wgvswyatbrdggrdadqss.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg4ODI0OCwiZXhwIjoyMDkxNDY0MjQ4fQ.lM4ygKTqjk5n3EEaBxrhlE95Pr_ZHmqmO0GuqIjgF6g'

const supabase = createClient(url, key)

async function testQuery() {
  const { data, error } = await supabase
    .from('dsa_questions')
    .select(`*, dsa_progress!left(status)`)
    .eq('is_important', true)
    .is('dsa_progress.status', null)
    .limit(50)

  if (error) {
    console.error("SUPABASE ERROR:", error)
  } else {
    console.log(`Success! Fetched ${data.length} questions.`)
  }
}

testQuery()
