import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const sql = `
  -- Enable RLS for all listed tables
  DO $$
  DECLARE
    tab RECORD;
  BEGIN
    FOR tab IN 
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
    LOOP
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tab.tablename);
    END LOOP;
  END $$;

  -- Ensure anon and authenticated roles have access to the schema and tables
  GRANT USAGE ON SCHEMA public TO anon;
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT USAGE ON SCHEMA public TO service_role;
  
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
  
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

  -- Cover api schema as well if it exists
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') THEN
      GRANT USAGE ON SCHEMA api TO anon;
      GRANT USAGE ON SCHEMA api TO authenticated;
      GRANT USAGE ON SCHEMA api TO service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA api TO anon;
      GRANT ALL ON ALL TABLES IN SCHEMA api TO authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;
    END IF;
  END $$;

  -- Default privileges for future tables
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

  -- Create generic permissive policies for all roles
  DO $$
  DECLARE
    tab RECORD;
  BEGIN
    FOR tab IN 
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS "Public can do all on %I" ON public.%I', tab.tablename, tab.tablename);
      EXECUTE format('CREATE POLICY "Public can do all on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tab.tablename, tab.tablename);
    END LOOP;
  END $$;
`;

async function applyRLS() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query(sql);
    console.log('RLS policies applied successfully');
  } catch (err) {
    console.error('Error applying RLS policies:', err);
  } finally {
    await client.end();
  }
}

applyRLS();
