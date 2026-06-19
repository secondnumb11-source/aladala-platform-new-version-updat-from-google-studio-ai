// src/services/whatsappService.ts

export const WHAPI_URL = 'https://gate.whapi.cloud/';
export const WHAPI_TOKEN = 'ugqkwwhM0LstMWkWgClXa4xuWQ80SgYg'; // Provided user token

export interface WhapiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * Pings the Whapi Cloud API to check connectivity and token validity.
 */
export const checkWhatsappConnection = async (): Promise<WhapiResponse> => {
  try {
    const res = await fetch('/api/whatsapp/check');
    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        message: `HTTP Error ${res.status}: ${res.statusText}`,
        error: errBody
      };
    }

    const data = await res.json();
    if (!data.success) {
      return { success: false, message: 'فشل الفحص' };
    }
    return {
      success: true,
      message: 'تم الاتصال بخوادم Whapi Cloud بشكل سليم.',
      data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'خطأ في الشبكة أو تعذر الاتصال بالخادم.',
      error: error?.message || 'Unknown error'
    };
  }
};

/**
 * Sends a real WhatsApp message using Whapi Cloud via proxy.
 * @param to Phone number with country code (e.g., 966500000000)
 * @param text The message text to send
 */
export const sendWhatsappMessage = async (to: string, text: string): Promise<WhapiResponse> => {
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: to,
        message: text
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        message: `فشل الإرسال. (HTTP ${res.status})`,
        error: errBody
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: 'تم إرسال رسالة الواتساب بنجاح.',
      data
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'فشل إرسال رسالة الواتساب بسبب خطأ في الاتصال.',
      error: error?.message || 'Unknown error'
    };
  }
};
