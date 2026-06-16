-- Production Supabase SQL Schema (Final)
-- Generated to ensure full compatibility with the existing application architecture 
-- and defined durable storage requirements. No Functions, Triggers, or RLS Policies are included.

-- 1. Prerequisites and Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. profiles (Linked with Supabase Authentication)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'lawyer',
    avatar_url TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. employees (Admin and Staff Management)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    salary DECIMAL(12,2),
    department VARCHAR(100),
    join_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. clients (Legal Entities and Individuals)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    id_number VARCHAR(100),
    najiz_id VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS najiz_id VARCHAR(100);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 5. cases (Core Legal Matters)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    case_number VARCHAR(100),
    najiz_case_number VARCHAR(100),
    title VARCHAR(255),
    category VARCHAR(100),
    stage VARCHAR(100),
    status VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    court_name VARCHAR(255),
    opponent_name VARCHAR(255),
    summary TEXT,
    details TEXT,
    last_session_at TIMESTAMPTZ,
    next_session_at TIMESTAMPTZ,
    attachments_count INTEGER DEFAULT 0,
    lawyers JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS stage VARCHAR(100);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS status VARCHAR(100);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_name VARCHAR(255);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS opponent_name VARCHAR(255);
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS next_session_at TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lawyers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. hearings (Court Sessions Tracking)
CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    date DATE,
    time TIME,
    location VARCHAR(255),
    hall VARCHAR(100),
    judge VARCHAR(255),
    status VARCHAR(100) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS hall VARCHAR(100);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS judge VARCHAR(255);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'scheduled';
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. tasks (Actionable Items for Staff)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'normal',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- 8. powers_of_attorney (Legal Agencies/POAs)
CREATE TABLE IF NOT EXISTS public.powers_of_attorney (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    poa_number VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.powers_of_attorney ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.powers_of_attorney ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 9. documents (Lawsuit Files and OCR Results)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    size VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    content_text TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 10. attachments (Binary Files Linked to Cases)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    upload_date DATE,
    category VARCHAR(100),
    storage_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. client_portal (Client Specific Settings)
CREATE TABLE IF NOT EXISTS public.client_portal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. employee_portal (Employee Specific Settings)
CREATE TABLE IF NOT EXISTS public.employee_portal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. appointments (Scheduling and Meetings)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    purpose VARCHAR(255),
    date DATE,
    time TIME,
    status VARCHAR(100) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. attendance (HR Management)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'present',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. leave_requests (HR Management)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. notifications (System Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(100) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. invoices (Billing and Finance)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    vat DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    status VARCHAR(100) DEFAULT 'draft',
    issue_date DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. payments (Financial Transactions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. user_preferences (App Customization)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(20) DEFAULT 'ar',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. user_states (State Persistence for UI)
CREATE TABLE IF NOT EXISTS public.user_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    state_key VARCHAR(100) NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, state_key)
);

-- 21. audit_trails (Security and Compliance Logs)
CREATE TABLE IF NOT EXISTS public.audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 22. system_errors (Diagnostic Monitoring)
CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    error_message TEXT,
    stack_trace TEXT,
    module VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'error',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 23. najiz_sync_logs (Najiz Integration Performance Tracking)
CREATE TABLE IF NOT EXISTS public.najiz_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100),
    status VARCHAR(50),
    records_count INTEGER DEFAULT 0,
    raw_response TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. najiz_case_history (Timeline of External Status Changes)
CREATE TABLE IF NOT EXISTS public.najiz_case_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    historical_status VARCHAR(100),
    update_details TEXT,
    source_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. najiz_sync_settings (Client/Lawyer Najiz Configuration)
CREATE TABLE IF NOT EXISTS public.najiz_sync_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.najiz_sync_settings ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 26. Performance Indices
CREATE INDEX IF NOT EXISTS idx_profiles_uid ON public.profiles(uid);
CREATE INDEX IF NOT EXISTS idx_clients_najiz_id ON public.clients(najiz_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_najiz_case_number ON public.cases(najiz_case_number);
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON public.tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_powers_of_attorney_client_id ON public.powers_of_attorney(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_attachments_case_id ON public.attachments(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_states_user_id ON public.user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON public.audit_trails(user_id);
