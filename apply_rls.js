import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

const sql = `
  -- Enable RLS for all listed tables
  ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS employees ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS cases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS hearings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS powers_of_attorney ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;

  -- Create generic permissive policies for anon/authenticated roles or service_role 
  -- since they are accessed securely via the server
  
  -- Policy for clients
  DROP POLICY IF EXISTS "Service role can do all on clients" ON clients;
  CREATE POLICY "Service role can do all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for employees
  DROP POLICY IF EXISTS "Service role can do all on employees" ON employees;
  CREATE POLICY "Service role can do all on employees" ON employees FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for cases
  DROP POLICY IF EXISTS "Service role can do all on cases" ON cases;
  CREATE POLICY "Service role can do all on cases" ON cases FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for tasks
  DROP POLICY IF EXISTS "Service role can do all on tasks" ON tasks;
  CREATE POLICY "Service role can do all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for hearings
  DROP POLICY IF EXISTS "Service role can do all on hearings" ON hearings;
  CREATE POLICY "Service role can do all on hearings" ON hearings FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for powers_of_attorney
  DROP POLICY IF EXISTS "Service role can do all on powers_of_attorney" ON powers_of_attorney;
  CREATE POLICY "Service role can do all on powers_of_attorney" ON powers_of_attorney FOR ALL USING (true) WITH CHECK (true);
  
  -- Policy for invoices
  DROP POLICY IF EXISTS "Service role can do all on invoices" ON invoices;
  CREATE POLICY "Service role can do all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
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
