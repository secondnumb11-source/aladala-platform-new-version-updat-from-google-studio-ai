import { Client } from 'pg';

async function run() {
  const activeUrl = process.env.POSTGRES_URL;
  if (!activeUrl) {
    console.error('No POSTGRES_URL provided.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: activeUrl,
    connectionTimeoutMillis: 10000,
    ssl: activeUrl.includes('localhost') || activeUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected. Running fix SQL...');
    
    await client.query(`
      -- إعادة بناء RLS من الصفر
      DO $$
      DECLARE pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname FROM pg_policies
          WHERE tablename = 'clients'
        LOOP
          EXECUTE 'DROP POLICY IF EXISTS "' ||
            pol.policyname || '" ON public.clients';
        END LOOP;
      END $$;
      
      -- سياسة واحدة مفتوحة
      ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "clients_full_access" ON public.clients
        AS PERMISSIVE FOR ALL TO PUBLIC
        USING (true) WITH CHECK (true);
      
      GRANT ALL ON public.clients TO anon;
      GRANT ALL ON public.clients TO authenticated;
      GRANT ALL ON public.clients TO service_role;
      GRANT ALL ON public.clients TO PUBLIC;
      
      -- نفس الشيء لجدول الجلسات
      DO $$
      DECLARE pol RECORD;
      BEGIN
        FOR pol IN
          SELECT policyname FROM pg_policies
          WHERE tablename = 'client_portal_sessions'
        LOOP
          EXECUTE 'DROP POLICY IF EXISTS "' ||
            pol.policyname ||
            '" ON public.client_portal_sessions';
        END LOOP;
      END $$;
      
      ALTER TABLE public.client_portal_sessions
        DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.client_portal_sessions
        ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "client_sessions_full_access"
        ON public.client_portal_sessions
        AS PERMISSIVE FOR ALL TO PUBLIC
        USING (true) WITH CHECK (true);
      
      GRANT ALL ON public.client_portal_sessions TO anon;
      GRANT ALL ON public.client_portal_sessions TO authenticated;
      GRANT ALL ON public.client_portal_sessions TO service_role;
      
      -- جعل جميع الحقول اختيارية
      ALTER TABLE public.clients
        ALTER COLUMN national_id DROP NOT NULL,
        ALTER COLUMN id_number DROP NOT NULL,
        ALTER COLUMN email DROP NOT NULL,
        ALTER COLUMN phone DROP NOT NULL,
        ALTER COLUMN portal_username DROP NOT NULL,
        ALTER COLUMN portal_password DROP NOT NULL;
      
      -- إضافة قيم افتراضية
      ALTER TABLE public.clients
        ALTER COLUMN status SET DEFAULT 'active',
        ALTER COLUMN is_company SET DEFAULT FALSE,
        ALTER COLUMN active_portal SET DEFAULT FALSE;
      
      -- تطبيع status العملاء الحاليين
      UPDATE public.clients SET status = 'active'
      WHERE status IN ('نشط','نشيط','فعال','مفعّل','مفعل','');
      
      UPDATE public.clients SET status = 'inactive'
      WHERE status IN ('غير نشط','معطّل','معطل','موقوف');
      
      -- Trigger لتطبيع status تلقائياً
      CREATE OR REPLACE FUNCTION normalize_client_data()
      RETURNS TRIGGER AS $$
      BEGIN
        -- تطبيع status
        NEW.status := CASE NEW.status
          WHEN 'نشط' THEN 'active'
          WHEN 'نشيط' THEN 'active'
          WHEN 'فعال' THEN 'active'
          WHEN 'مفعّل' THEN 'active'
          WHEN 'مفعل' THEN 'active'
          WHEN 'غير نشط' THEN 'inactive'
          WHEN 'معطّل' THEN 'inactive'
          WHEN 'معطل' THEN 'inactive'
          WHEN 'موقوف' THEN 'inactive'
          ELSE COALESCE(NEW.status, 'active')
        END;
      
        -- تأكد من updated_at
        NEW.updated_at := NOW();
      
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS normalize_client_trigger
        ON public.clients;
      CREATE TRIGGER normalize_client_trigger
        BEFORE INSERT OR UPDATE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION normalize_client_data();
    `);

    console.log('SQL applied successfully.');
    
  } catch (err) {
    console.error('Error applying SQL', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
