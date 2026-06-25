import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function checkPolicyTypes() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT policyname, permissive 
      FROM pg_policies 
      WHERE tablename = 'clients' AND schemaname = 'public';
    `);
    console.log('Policy types for public.clients:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkPolicyTypes();
