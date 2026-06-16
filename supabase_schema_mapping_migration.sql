-- Database Mapping Validation & Schema Compatibility Fixes
-- Ensuring all modules are correctly mapped to their durable storage tables.

-- 1. Extend cases with missing sync and count fields if not present
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0;

-- 2. Extend documents with content_text for OCR results
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_text TEXT;

-- 3. Extend clients with sync fields
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 4. Create missing tables requested in the audit
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(100), -- alert, info, success
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Audit Trails / Action Logs Mapping
-- (Ensure audit_trails exists as it is the target name)
CREATE TABLE IF NOT EXISTS public.audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Najiz Sync Tracking
CREATE TABLE IF NOT EXISTS public.najiz_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100),
    status VARCHAR(50), -- success, failure
    records_count INTEGER DEFAULT 0,
    raw_response TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.najiz_case_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    historical_status VARCHAR(100),
    update_details TEXT,
    source_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. User States Persistence (Client vs Employee Portal settings)
CREATE TABLE IF NOT EXISTS public.user_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 8. Add system_errors if not present
CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_message TEXT,
    stack_trace TEXT,
    module VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'error',
    created_at TIMESTAMPTZ DEFAULT now()
);
