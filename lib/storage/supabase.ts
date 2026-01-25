import type { StorageAdapter, PutResult } from '@/lib/storage/index';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseStorageAdapter implements StorageAdapter {
  provider: PutResult['provider'] = 'supabase';

  private bucket() {
    return process.env.SUPABASE_STORAGE_BUCKET ?? 'teira-assets';
  }

  async putObject(key: string, data: Uint8Array, contentType: string): Promise<PutResult> {
    const sb = supabaseAdmin();
    const bucket = this.bucket();
    const { error } = await sb.storage.from(bucket).upload(key, data, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    return { provider: 'supabase', key };
  }

  async putPdf(key: string, data: Uint8Array): Promise<PutResult> {
    return await this.putObject(key, data, 'application/pdf');
  }

  async putXml(key: string, data: Uint8Array): Promise<PutResult> {
    return await this.putObject(key, data, 'application/xml');
  }

  async putXlsx(key: string, data: Uint8Array): Promise<PutResult> {
    return await this.putObject(key, data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  async createSignedUrl(key: string, expiresSeconds: number): Promise<string> {
    const sb = supabaseAdmin();
    const bucket = this.bucket();
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(key, expiresSeconds);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to create signed URL');
    return data.signedUrl;
  }

  async read(_key: string): Promise<Buffer> {
    void _key;
    throw new Error('read() not supported for Supabase adapter; use signed URL download');
  }
}
