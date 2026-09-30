interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly PDR_BUILD_ID: string;
  readonly VITE_PDR_URL: string;
  readonly VITE_CATALOG_PUBLIC_KEY: string;
}
