const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:6F%40rpP%23S_yV%40%25mS@db.wgvswyatbrdggrdadqss.supabase.co:5432/postgres',
  });

  await client.connect();

  const sql = `
    -- Create resumes bucket
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('resumes', 'resumes', false)
    ON CONFLICT (id) DO NOTHING;

    -- Create schedules bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('schedules', 'schedules', false)
    ON CONFLICT (id) DO NOTHING;

    -- Enable RLS on storage.objects if not already
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can upload their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own resume" ON storage.objects;

    DROP POLICY IF EXISTS "Users can upload their own schedules" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own schedules" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own schedules" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own schedules" ON storage.objects;

    -- Policies for resumes
    CREATE POLICY "Users can upload their own resume" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can view their own resume" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can update their own resume" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can delete their own resume" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

    -- Policies for schedules
    CREATE POLICY "Users can upload their own schedules" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'schedules' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can view their own schedules" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'schedules' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can update their own schedules" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'schedules' AND auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can delete their own schedules" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'schedules' AND auth.uid()::text = (storage.foldername(name))[1]);
  `;

  try {
    await client.query(sql);
    console.log("Storage buckets and policies created successfully.");
  } catch (err) {
    console.error("Error creating buckets/policies:", err);
  } finally {
    await client.end();
  }
}

run();
