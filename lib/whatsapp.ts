import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

let waSock: any = null;

export async function connectToWhatsApp() {
  if (waSock) return waSock;

  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  waSock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  waSock.ev.on('creds.update', saveCreds);

  waSock.ev.on('connection.update', (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('ملاظہ کریں: ٹرمینل میں QR کوڈ اسکین کریں:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('کنکشن بند ہو گیا، دوبارہ کنیکٹ ہو رہا ہے...', shouldReconnect);
      if (shouldReconnect) {
        waSock = null;
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ Baileys WhatsApp سیشن کامیابی سے شروع ہو گیا ہے!');
    }
  });

  return waSock;
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const sock = await connectToWhatsApp();
    
    // فون نمبر کو بین الاقوامی فارمیٹ میں لانا (مثال: 923001234567)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.slice(1);
    }
    
    const jid = `${formattedPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    return { success: true };
  } catch (error: any) {
    console.error('WhatsApp Send Error:', error);
    return { success: false, error: error.message };
  }
}