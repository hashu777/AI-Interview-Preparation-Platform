import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class LocalResumeStorageService {
  private readonly root = join(process.cwd(), 'data', 'resumes');
  async save(userId: string, content: Buffer): Promise<string> {
    const key = `${userId}/${randomUUID()}.pdf`;
    const destination = join(this.root, ...key.split('/'));
    await mkdir(join(this.root, userId), { recursive: true });
    await writeFile(destination, content, { flag: 'wx' });
    return key;
  }
  read(storageKey: string): Promise<Buffer> { return readFile(join(this.root, ...storageKey.split('/'))); }
}
