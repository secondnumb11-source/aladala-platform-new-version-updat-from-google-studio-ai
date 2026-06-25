import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function checkRLSStatus() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      JOIN pg_class ON pg_tables.tablename = pg_class.relname
      WHERE tablename = 'clients';
    `);
    console.log('RLS Status for clients:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkRLSStatus();
