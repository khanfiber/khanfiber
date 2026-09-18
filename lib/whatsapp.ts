// واٹس ایپ ڈائریکٹ URL اوپن کرنے کا فنکشن
export function openWhatsAppDirect(phone: string, message: string) {
  let formattedPhone = phone.replace(/[^0-9]/g, '');

  if (formattedPhone.startsWith('0')) {
    formattedPhone = '92' + formattedPhone.slice(1);
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }

  return whatsappUrl;
}

// 1. نیو کنکشن کا واٹس ایپ میسج
export function sendNewConnectionMsg(customer: { name: string; phone: string; user_id?: string; package?: string }) {
  const message = `السلام علیکم ${customer.name} صاحب!\n\nخان فائبر انٹرنیٹ نیٹ ورک میں خوش آمدید! 🎉\nآپ کا نیا کنکشن کامیابی سے ایکٹیو کر دیا گیا ہے۔\n\n👤 صارف کا نام: ${customer.name}\n🆔 یوزر ID: ${customer.user_id || 'N/A'}\n📦 پیکیج: ${customer.package || 'Standard'}\n\nکسی بھی مسئلے یا معلومات کے لیے ہم سے رابطہ کریں۔ شکریہ!`;
  
  return openWhatsAppDirect(customer.phone, message);
}

// 2. بل وصولی کا واٹس ایپ میسج
export function sendBillPaymentMsg(payment: { name: string; phone: string; amount: number; month?: string }) {
  const message = `السلام علیکم ${payment.name} صاحب!\n\nخان فائبر انٹرنیٹ نیٹ ورک کی طرف سے بل کی وصولی:\n\n💵 وصول شدہ رقم: Rs ${payment.amount}\n📅 ماہ: ${payment.month || 'کرنٹ منتھ'}\n\nآپ کا بل موصول ہو گیا ہے اور اکاؤنٹ اپ ڈیٹ کر دیا گیا ہے۔ شکریہ!`;

  return openWhatsAppDirect(payment.phone, message);
}