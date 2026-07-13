import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { LocalResumeStorageService } from '../../infrastructure/storage/local-resume-storage.service';
@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService, private readonly storage: LocalResumeStorageService) {}
  list(userId: string) { return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } }); }
  create(userId: string, title: string) { return this.prisma.resume.create({ data: { userId, title: title.trim() } }); }
  async addVersion(userId: string, resumeId: string, file: { originalName: string; mimeType: string; size: number; buffer: Buffer }) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId }, include: { versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 } } });
    if (!resume) throw new NotFoundException('Resume not found.');
    const storageKey = await this.storage.save(userId, file.buffer);
    return this.prisma.resumeVersion.create({ data: { resumeId, version: (resume.versions[0]?.version ?? 0) + 1, originalName: file.originalName, storageKey, mimeType: file.mimeType, byteSize: file.size, status: 'UPLOADED' } });
  }
}
