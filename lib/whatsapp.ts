export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // اگر لوکل پر چل رہا ہے تو localhost:3001
    const WHATSAPP_SERVER_URL = process.env.WHATSAPP_API_URL || 'https://quiet-forks-stick.loca.lt/send-message';

    const response = await fetch(WHATSAPP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('WhatsApp Service Error:', error);
    return { success: false, error: 'واٹس ایپ سرور سے رابطہ نہیں ہو سکا' };
  }
}