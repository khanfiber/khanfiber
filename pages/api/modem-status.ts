import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ip, mac } = req.query;

  if (!ip && !mac) {
    return res.status(400).json({ success: false, message: 'IP یا MAC ایڈریس فراہم نہیں کیا گیا' });
  }

  try {
    const targetIp = (ip as string) || '192.168.100.1';

    // اوریجنل موڈیم / ONU ویب انٹرفیس یا SNMP ڈیوائس کو ریکویسٹ بھیجنا
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 سیکنڈ ٹائم آؤٹ

    const response = await fetch(`http://${targetIp}/api/onu/status`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const liveData = await response.json();
      return res.status(200).json({
        success: true,
        ponStatus: liveData.ponStatus || 'Connected',
        rxPower: parseFloat(liveData.rxPower),
        txPower: parseFloat(liveData.txPower),
        signalStrength: Math.min(Math.max(Math.round(((liveData.rxPower + 30) / 15) * 100), 0), 100),
        lanCableConnected: liveData.lanConnected ?? true,
        opticalQuality: liveData.rxPower < -27 ? 'Critical' : liveData.rxPower < -23 ? 'Warning' : 'Good'
      });
    } else {
      throw new Error('موڈیم نے ڈیٹا کا رسپانس نہیں دیا');
    }
  } catch (error: any) {
    return res.status(504).json({
      success: false,
      message: 'موڈیم سے رابطہ قائم نہیں ہو سکا (Modem Offline or Unreachable)',
      error: error.message
    });
  }
}