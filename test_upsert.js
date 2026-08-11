const { createClient } = require('@supabase/supabase-js')

const url = 'https://wgvswyatbrdggrdadqss.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnN3eWF0YnJkZ2dyZGFkcXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg4ODI0OCwiZXhwIjoyMDkxNDY0MjQ4fQ.lM4ygKTqjk5n3EEaBxrhlE95Pr_ZHmqmO0GuqIjgF6g'

const supabase = createClient(url, key)

async function testUpsert() {
  // Let's create a fake user ID for testing
  const fakeUserId = '11111111-1111-1111-1111-111111111111'
  
  const { data, error } = await supabase
      .from('peer_profiles')
      .upsert({ user_id: fakeUserId, connect_code: 'TEST01' }, { onConflict: 'user_id' })
      .select('connect_code, display_name')
      .single();

  if (error) {
    console.error("UPSERT ERROR:", error)
  } else {
    console.log("Upsert succeeded! Data:", data)
    // clean up
    await supabase.from('peer_profiles').delete().eq('user_id', fakeUserId)
  }
}

testUpsert()
