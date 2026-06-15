export class AIClassificationEngine {
    static normalizeRecord(rawData: any) {
        return {
            ...rawData,
            normalizedStatus: this.mapStatus(rawData.rawText || rawData.rawTitle || ''),
            detectedCategory: this.detectCategory(rawData),
            lastUpdateTimestamp: new Date().toISOString()
        };
    }

    private static mapStatus(text: string): string {
        const activeKeywords = ['مفتوحة', 'نشطة', 'قيد النظر', 'منظورة', 'مقبولة'];
        const closedKeywords = ['مغلقة', 'منتهية', 'تم الحكم', 'مشطوبة', 'مرفوضة'];
        
        if (activeKeywords.some(k => text.includes(k))) return 'ACTIVE';
        if (closedKeywords.some(k => text.includes(k))) return 'CLOSED';
        return 'UNKNOWN';
    }

    private static detectCategory(data: any): string {
        const textStr = JSON.stringify(data).toLowerCase();
        
        if (textStr.includes('قضية') || textStr.includes('دعوى') || textStr.includes('محكمة')) return 'CASES';
        if (textStr.includes('جلسة') || textStr.includes('موعد') || textStr.includes('قاعة')) return 'HEARINGS';
        if (textStr.includes('وكالة') || textStr.includes('توكيل') || textStr.includes('مستفيد')) return 'AGENCIES';
        if (textStr.includes('تنفيذ') || textStr.includes('سند') || textStr.includes('مطالبة')) return 'EXECUTIONS';
        if (textStr.includes('عميل') || textStr.includes('خصم') || textStr.includes('طَرَف')) return 'CLIENTS';

        return 'UNCLASSIFIED';
    }

    static processBatch(batch: any[]) {
        const processed = {
            CASES: [],
            HEARINGS: [],
            AGENCIES: [],
            EXECUTIONS: [],
            CLIENTS: [],
            UNCLASSIFIED: []
        };

        batch.forEach(item => {
            const normalized = this.normalizeRecord(item);
            if (processed[normalized.detectedCategory as keyof typeof processed]) {
                (processed[normalized.detectedCategory as keyof typeof processed] as any[]).push(normalized);
            }
        });

        // Deduplication
        Object.keys(processed).forEach(key => {
            const arr = processed[key as keyof typeof processed];
            processed[key as keyof typeof processed] = arr.filter((v: any, i: number, a: any[]) => 
                a.findIndex(t => (JSON.stringify(t) === JSON.stringify(v))) === i
            ) as never[];
        });

        return processed;
    }
}
