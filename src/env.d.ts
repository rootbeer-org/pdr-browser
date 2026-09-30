interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly PDR_DATA_PATH: string;
  readonly VITE_PDR_URL: string;
  readonly VITE_CATALOG_PUBLIC_KEY: string;
}
