# تصميم قاعدة البيانات (Database Schema & ERD) لنظام إدارة مكاتب المحاماة

تحتوي هذه الوثيقة على التصميم الاحترافي والكامل لهيكل قاعدة البيانات ومخطط العلاقات (ERD) لنظام إدارة المحاماة، مبني ليتوافق مع تخصيصات Supabase PostgreSQL ويدعم التكامل التام مع بوابة "ناجز" وفق المتطلبات المحددة.

## مخطط العلاقات (ERD - Entity Relationship Diagram)

```mermaid
erDiagram
    clients ||--o{ cases : "has"
    clients ||--o{ poas : "issues"
    clients ||--o{ invoices : "billed via"
    clients ||--o{ client_portal : "has access"
    
    cases ||--o{ hearings : "contains"
    cases ||--o{ tasks : "has"
    cases ||--o{ documents : "has"
    cases ||--o{ case_events : "tracks"
    cases ||--o{ notes : "has"
    cases ||--o{ najiz_case_history : "logs history"
    
    invoices ||--o{ payments : "receives"
    
    employees ||--o{ tasks : "assigned to"
    employees ||--o{ employee_portal : "has access"
    employees ||--o{ appointments : "attends"
    
    users ||--|| employees : "linked to"
    users ||--|| clients : "linked to"
    users ||--o{ audit_trails : "generates"
    users ||--o{ notifications : "receives"
    users ||--o{ user_states : "has"
    
    documents ||--o{ attachments : "includes"

    users {
        uuid id PK
    }
    clients {
        uuid id PK
    }
    cases {
        uuid id PK
    }
    hearings {
        uuid id PK
    }
    employees {
        uuid id PK
    }
    tasks {
        uuid id PK
    }
    poas {
        uuid id PK
    }
    documents {
        uuid id PK
    }
    attachments {
        uuid id PK
    }
    notifications {
        uuid id PK
    }
    audit_trails {
        uuid id PK
    }
    client_portal {
        uuid id PK
    }
    employee_portal {
        uuid id PK
    }
    invoices {
        uuid id PK
    }
    payments {
        uuid id PK
    }
    appointments {
        uuid id PK
    }
    notes {
        uuid id PK
    }
    case_events {
        uuid id PK
    }
    najiz_sync_logs {
        uuid id PK
    }
    najiz_sync_settings {
        uuid id PK
    }
    najiz_case_history {
        uuid id PK
    }
    user_states {
        uuid id PK
    }
```

---

## تفاصيل الجداول (Schema Details)

*ملاحظة: جميع الجداول تحتوي على الحقول الافتراضية التالية:*
- `id`: UUID (Primary Key, Default: `uuid_generate_v4()`)
- `created_at`: Timestampz (Default: `now()`)
- `updated_at`: Timestampz (Default: `now()`)

### 1. العملاء (`clients`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `name` | String | اسم العميل/الشركة |
| `national_id`| String | رقم الهوية / السجل التجاري (Indexed/Unique) |
| `is_company`| Boolean | تحديد نوع العميل (فرد/شركة) |
| `phone` | String | رقم الجوال (Indexed) |
| `email` | String | البريد الإلكتروني |
| `address` | Text | العنوان التفصيلي |
| `source` | String | مصدر العميل (يدوي، بوابة، ناجز) |
| `najiz_id` | String | معرّف العميل في ناجز للتأكد من عدم التكرار والدمج (Indexed) |

### 2. القضايا (`cases`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `client_id` | UUID | (FK -> clients.id) (Indexed) |
| `case_number` | String | رقم القضية الأساسي (Indexed) |
| `najiz_case_number`| String | رقم القضية في ناجز (Unique/Indexed للدمج) |
| `case_name` | String | عنوان القضية |
| `category` | String | التصنيف (تجاري، عمالي، إلخ) |
| `stage` | String | المرحلة (ترافع، استئناف، تنفيذ) |
| `status` | String | الحالة الحالية |
| `court_name`| String | جهة التقاضي |
| `is_najiz_sync`| Boolean | هل هي مزامنة مع ناجز |
| `last_sync_date`| Timestamptz | تاريخ آخر مزامنة تم دمجها |
| `court_department`| String | الدائرة القضائية |
| `opponents` | JSONB | قائمة الخصوم |
| `is_manual` | Boolean | إذا تمت إضافتها يدوياً يتم التحديث لاحقاً من ناجز |

### 3. الجلسات (`hearings`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `case_id` | UUID | (FK -> cases.id) (Indexed) |
| `hearing_date`| Date | تاريخ الجلسة (Indexed) |
| `hearing_time`| Time | وقت الجلسة |
| `court_name`| String | المحكمة / الدائرة المرتبطة |
| `status` | String | حالة الجلسة (قادمة، منتهية، تأجيل) |
| `hearing_link`| String | رابط الجلسة (عن بعد) |
| `najiz_id` | String | معرّف الجلسة في ناجز (Unique/Indexed) |

### 4. الموظفين (`employees`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `user_id` | UUID | (FK -> users.id, Nullable) (Indexed) |
| `name` | String | اسم الموظف |
| `national_id`| String | الهوية (Unique) |
| `role` | String | المسمى الوظيفي (محامي، مستشار، إداري) |
| `phone` | String | الجوال |
| `email` | String | البريد الإلكتروني |

### 5. المستخدمين (`users`)
*(نعتمد على جدول Auth الخاص بـ Supabase عادة `auth.users`، ولكن يمكن إنشاء جدول مرتبط لإدارة الصلاحيات المخصصة).*
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `auth_id` | UUID | مرتبط بـ Supabase Auth (Unique/Indexed) |
| `role` | String | الدور (Admin, Lawyer, Client, Guest) |
| `status` | String | نشط / موقوف |

### 6. المهام (`tasks`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `case_id` | UUID | (FK -> cases.id, Nullable) (Indexed) |
| `assignee_id`| UUID | (FK -> employees.id) (Indexed) |
| `title` | String | عنوان المهمة |
| `description`| Text | التفاصيل |
| `status` | String | (todo, in_progress, done) |
| `due_date` | Date | تاريخ الاستحقاق (Indexed) |

### 7. الوكالات القضائية (`poas` - Powers of Attorney)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `client_id` | UUID | (FK -> clients.id) (Indexed) |
| `poa_number`| String | رقم الوكالة (Unique/Indexed) |
| `issue_date`| Date | تاريخ الإصدار |
| `expiry_date`| Date | تاريخ الانتهاء (Indexed للتنبيهات) |
| `status` | String | سارية / منتهية / مفسوخة |
| `najiz_id` | String | المعرّف في ناجز |

### 8. المستندات (`documents`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `case_id` | UUID | (FK -> cases.id, Nullable) (Indexed) |
| `client_id` | UUID | (FK -> clients.id, Nullable) |
| `title` | String | اسم المستند |
| `type` | String | نوع المستند (لائحة، حكم، عقد) |
| `status` | String | حالة الاعتماد |

### 9. المرفقات (`attachments`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `document_id`| UUID | (FK -> documents.id) (Indexed) |
| `file_name` | String | اسم الملف |
| `file_url` | String | رابط الملف في Supabase Storage |
| `file_size` | Integer | حجم الملف |
| `mime_type` | String | نوع الملف |

### 10. الإشعارات (`notifications`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `user_id` | UUID | (FK -> users.id) (Indexed) |
| `title` | String | عنوان التنبيه |
| `message` | Text | محتوى التنبيه |
| `type` | String | نوع الإشعار (سيستم، جلسة، مهمة) |
| `is_read` | Boolean | مقروء أم لا |

### 11. سجل العمليات (`audit_trails`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `user_id` | UUID | (FK -> users.id) (Indexed) |
| `action` | String | نوع الإجراء (CREATE, UPDATE, DELETE) |
| `table_name` | String | اسم الجدول المستهدف |
| `record_id` | UUID | معرّف السجل المتأثر |
| `old_data` | JSONB | البيانات قبل التعديل |
| `new_data` | JSONB | البيانات بعد التعديل |
| `ip_address` | String | عنوان الـ IP |

### 12. بوابة العملاء (`client_portal`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `client_id` | UUID | (FK -> clients.id) (Unique/Indexed) |
| `access_token`| String | رمز الدخول أو الصلاحية |
| `last_login` | Timestamptz| تاريخ آخر دخول |
| `preferences`| JSONB | إعدادات العميل في البوابة |

### 13. بوابة الموظفين (`employee_portal`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `employee_id`| UUID | (FK -> employees.id) (Unique/Indexed) |
| `dashboard_config`| JSONB | ترتيب واجهة המوظف |
| `last_active`| Timestamptz| آخر ظهور |

### 14. الفواتير (`invoices`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `client_id` | UUID | (FK -> clients.id) (Indexed) |
| `case_id` | UUID | (FK -> cases.id, Nullable) |
| `invoice_no` | String | رقم الفاتورة (Unique/Indexed) |
| `subtotal` | Decimal | المبلغ الأصلي |
| `vat_amount` | Decimal | قيمة الضريبة |
| `total` | Decimal | الإجمالي الحقيقي |
| `status` | String | (draft, sent, paid, overdue, cancelled) |
| `due_date` | Date | تاريخ الاستحقاق |

### 15. المدفوعات (`payments`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `invoice_id` | UUID | (FK -> invoices.id) (Indexed) |
| `amount_paid`| Decimal | المبلغ المدفوع |
| `payment_date`| Date | تاريخ الدفع |
| `payment_method`| String| طريقة الدفع (حوالة، كاش، مدى) |
| `reference_no`| String | رقم المرجع / الحوالة |

### 16. المواعيد (`appointments`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `client_id` | UUID | (FK -> clients.id) |
| `employee_id`| UUID | (FK -> employees.id) (Indexed) |
| `date_time` | Timestamptz| وقت الموعد (Indexed) |
| `purpose` | String | الغرض من الاجتماع |
| `status` | String | (scheduled, completed, cancelled) |

### 17. الملاحظات (`notes`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `entity_type`| String | نوع الكيان (case, client, task) |
| `entity_id` | UUID | معرّف الكيان |
| `author_id` | UUID | (FK -> users.id) |
| `content` | Text | محتوى الملاحظة |
| `is_private` | Boolean | ظاهرة للجميع أم لكاتبها فقط |

### 18. أحداث القضية (`case_events`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `case_id` | UUID | (FK -> cases.id) (Indexed) |
| `event_type` | String | نوع الحدث (تغيير حالة، حكم، إضافة خصم) |
| `event_date` | Timestamptz| وقت الحدث |
| `description`| Text | الوصف التفصيلي |
| `najiz_ref` | String | مرجع الحدث إذا كان من ناجز |

### 19. سجلات مزامنة ناجز (`najiz_sync_logs`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `sync_type` | String | (cases, hearings, poas) |
| `status` | String | (success, failed, partial) |
| `records_pulled`| Integer | عدد السجلات التي سُحبت |
| `records_merged`| Integer | عدد السجلات المدمجة/المحدثة |
| `error_details`| Text | تفاصيل الفشل إن وجدت |

### 20. إعدادات مزامنة ناجز (`najiz_sync_settings`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `is_active` | Boolean | تشغيل/إيقاف المزامنة |
| `sync_interval_hours`| Integer| التكرار كل كم ساعة |
| `auth_token` | Text | توكن الربط المشفر |
| `last_successful_sync`| Timestamptz| آخر مزامنة ناجحة |

### 21. تاريخ تحديثات ناجز (`najiz_case_history`)
*يستخدم للاحتفاظ بالبيانات القديمة وتتبع الداتا في حال تحديثها من ناجز (Versioning).*
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `case_id` | UUID | (FK -> cases.id) (Indexed) |
| `snapshot_date`| Timestamptz| وقت أخذ النسخة |
| `case_data` | JSONB | لقطة كاملة من بيانات ناجز للقضية |

### 22. حالات المستخدم (`user_states`)
| Name | Type | Description / Indexes |
|-------------|---------|-----------------------|
| `user_id` | UUID | (FK -> users.id) (Unique/Indexed) |
| `is_online` | Boolean | حالة الاتصال (لـ Realtime Sync) |
| `last_seen` | Timestamptz| وقت آخر ظهور |
| `device_info`| JSONB | معلومات المتصفح والجهاز |

---
## قواعد وسياسات المزامنة مع "ناجز" وفق المتطلبات (Najiz Sync Rules)
1. **لا يتم حذف البيانات نهائياً**: أي قضية، جلسة، أو صك قادم من ناجز لا يُحذف بل يُؤرشف أو تُغيّر حالته إلى `archived` / `closed`.
2. **الدمج بدلاً من التكرار (Merge / Upsert)**: عند مزامنة القضايا، يتم البحث بواسطة `najiz_case_number`. إذا كان موجوداً يتم عمل (Update) للحقول التي تغيرت فقط. إذا لم يكن موجوداً يتم عمل (Insert).
3. **أولوية البيانات (Source of Truth)**: إذا أُضيفت قضية يدوياً `is_manual = true`، ثم تم استيرادها من ناجز، يتم ربط الجلسات وتحديث الحقول تلقائياً لتصبح `is_najiz_sync = true` مع الاحتفاظ بالتعديلات المحلية.
4. **التاريخ (History Track)**: في كل مرة تتغير فيها بيانات أو حالة قضية قادمة من ناجز، يتم تسجيل نسخة من الـ Payload القديم في جدول `najiz_case_history` لضمان عدم ضياع التحديثات.

