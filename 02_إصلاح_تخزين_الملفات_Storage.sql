-- 1) إنشاء bucket التخزين الأساسي المستخدم في رفع المستندات إن لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- 2) إنشاء bucket النسخ الاحتياطية المستخدم من السيرفر
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('legal-backups', 'legal-backups', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- 3) سياسات الوصول لكل من الـ buckets أعلاه (قراءة/كتابة/حذف للجميع حالياً)
DROP POLICY IF EXISTS "allow_all_documents_bucket" ON storage.objects;
CREATE POLICY "allow_all_documents_bucket"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "allow_all_legal_backups_bucket" ON storage.objects;
CREATE POLICY "allow_all_legal_backups_bucket"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (bucket_id = 'legal-backups')
WITH CHECK (bucket_id = 'legal-backups');
