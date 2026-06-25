import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function checkPrivileges() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'clients' AND table_schema = 'public';
    `);
    console.log('Privileges for public.clients:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkPrivileges();
