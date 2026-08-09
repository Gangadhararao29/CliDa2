export interface DeviceInfo {
  deviceId: string;
  os: string;
  osVersion: string;
  browser: string;
  deviceType: string; // mobile / tablet / desktop
  userAgent: string;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  return {
    deviceId: getOrCreateDeviceId(),
    os: detectOS(ua),
    osVersion: detectOSVersion(ua),
    browser: detectBrowser(ua),
    deviceType: /Mobi|Android/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop',
    userAgent: ua
  };
}

function detectOS(ua: string): string {
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectOSVersion(ua: string): string {
  const match = ua.match(/(Windows NT|Mac OS X|Android|OS) ([\d._]+)/);
  return match ? match[2].replace(/_/g, '.') : 'unknown';
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Unknown';
}

function getOrCreateDeviceId(): string {
  const key = 'clida_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      id = crypto.randomUUID();
    } else {
      // Fallback UUID v4 generator for older WebView or non-secure contexts
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(key, id);
  }
  return id;
}
