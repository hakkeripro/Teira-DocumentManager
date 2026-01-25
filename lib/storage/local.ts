import fs from 'node:fs/promises';
import path from 'node:path';
import type { StorageAdapter, PutResult } from '@/lib/storage/index';

export class LocalStorageAdapter implements StorageAdapter {
  provider: PutResult['provider'] = 'local';
  private baseDir: string;

  constructor(baseDir = path.join(process.cwd(), 'var', 'storage')) {
    this.baseDir = baseDir;
  }

  private resolveKey(key: string) {
    const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const target = path.join(this.baseDir, normalized);
    const resolvedBase = path.resolve(this.baseDir);
    const resolvedTarget = path.resolve(target);
    if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
      throw new Error('Invalid storage key');
    }
    return resolvedTarget;
  }

  async putObject(key: string, data: Uint8Array, _contentType: string): Promise<PutResult> {
    void _contentType;
    const filePath = this.resolveKey(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, Buffer.from(data));
    return { provider: 'local', key };
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

  async createSignedUrl(key: string, _expiresSeconds: number): Promise<string> {
    void _expiresSeconds;
    // Local storage is served via proxy route; caller builds the URL.
    return key;
  }

  async read(key: string): Promise<Buffer> {
    const filePath = this.resolveKey(key);
    return await fs.readFile(filePath);
  }
}
