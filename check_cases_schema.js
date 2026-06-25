import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:Allah%40100200Allah@db.sydcelofkzvtsfatxnka.supabase.co:5432/postgres';

const client = new Client({ connectionString });
async function checkSchema() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cases' AND table_schema = 'public';
  `);
  console.log(res.rows);
  await client.end();
}
checkSchema();
