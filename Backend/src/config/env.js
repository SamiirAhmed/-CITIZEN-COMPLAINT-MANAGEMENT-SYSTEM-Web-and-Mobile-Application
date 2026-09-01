import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Windows/VPN DNS often fails Atlas host lookups (querySrv/ENOTFOUND).
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Keep system DNS if override is unavailable.
}

const backendRoot = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url)))
);

dotenv.config({ path: path.join(backendRoot, '.env') });
