import { LocalStorageAdapter } from '@/lib/storage/local';
import { SupabaseStorageAdapter } from '@/lib/storage/supabase';

export type StorageProvider = 'local' | 'supabase';

export type PutResult = {
  provider: StorageProvider;
  key: string;
};

export interface StorageAdapter {
  provider: StorageProvider;

  putObject: (key: string, data: Uint8Array, contentType: string) => Promise<PutResult>;
  putPdf: (key: string, data: Uint8Array) => Promise<PutResult>;
  putXml: (key: string, data: Uint8Array) => Promise<PutResult>;
  putXlsx: (key: string, data: Uint8Array) => Promise<PutResult>;

  createSignedUrl: (key: string, expiresSeconds: number) => Promise<string>;
  read: (key: string) => Promise<Buffer>;
}

export function getStorage(): StorageAdapter {
  const provider = (process.env.STORAGE_PROVIDER ?? 'local') as StorageProvider;
  if (provider === 'supabase') return new SupabaseStorageAdapter();
  return new LocalStorageAdapter();
}
