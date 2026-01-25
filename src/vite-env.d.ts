/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 */
interface ImportMetaEnv {
  /** Enable debug logging */
  readonly VITE_DEBUG: string;
  /** API Base URL */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
