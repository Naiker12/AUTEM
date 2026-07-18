import { useState, useEffect } from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsAR: boolean;
  browserName: string;
}

export function useDeviceDetection(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({
    isMobile: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    supportsAR: false,
    browserName: "unknown",
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid || /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    const supportsAR = isIOS || (isAndroid && "xr" in navigator);

    let browserName = "unknown";
    if (/CriOS/.test(ua)) browserName = "Chrome iOS";
    else if (/FxiOS/.test(ua)) browserName = "Firefox iOS";
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browserName = "Safari";
    else if (/Chrome/.test(ua) && !/Edg/.test(ua)) browserName = "Chrome";
    else if (/Firefox/.test(ua)) browserName = "Firefox";
    else if (/Edg/.test(ua)) browserName = "Edge";

    setInfo({
      isMobile,
      isDesktop: !isMobile,
      isIOS,
      isAndroid,
      supportsAR,
      browserName,
    });
  }, []);

  return info;
}
