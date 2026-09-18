import RouterOSClient from 'node-routeros';

export function getMikroTikClient() {
  return new RouterOSClient({
    host: process.env.MIKROTIK_HOST || '192.168.88.1',
    user: process.env.MIKROTIK_USER || 'admin',
    password: process.env.MIKROTIK_PASSWORD || '',
    port: parseInt(process.env.MIKROTIK_PORT || '8728'),
    timeout: 10,
  });
}