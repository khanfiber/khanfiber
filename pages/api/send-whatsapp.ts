import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppMessage } from '../../lib/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ message: 'Phone and message are required' });
  }

  const result = await sendWhatsAppMessage(phone, message);

  if (result.success) {
    return res.status(200).json({ success: true, message: 'Message sent successfully' });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}