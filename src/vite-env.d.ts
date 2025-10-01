/// <reference types="vite/client" />

interface Window {
  electron?: {
    fetchAcquaintData: (sitePrefix: string, siteId?: number) => Promise<string>;
  };
}
