import { Injectable, NotFoundException } from '@nestjs/common';
import { ResumeVersion } from '@prisma/client';
import pdf from 'pdf-parse';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LocalResumeStorageService } from '../../infrastructure/storage/local-resume-storage.service';
import { AtsService } from '../ats/ats.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalResumeStorageService,
    private readonly ats: AtsService,
  ) {}

  list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { versions: { orderBy: { version: 'desc' }, take: 1, include: { analysis: true } } },
    });
  }

  create(userId: string, title: string) {
    return this.prisma.resume.create({ data: { userId, title: title.trim() } });
  }

  async addVersion(userId: string, resumeId: string, file: { originalName: string; mimeType: string; size: number; buffer: Buffer }) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: { versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!resume) throw new NotFoundException('Resume not found.');

    const storageKey = await this.storage.save(userId, file.buffer);
    const version = await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        version: (resume.versions[0]?.version ?? 0) + 1,
        originalName: file.originalName,
        storageKey,
        mimeType: file.mimeType,
        byteSize: file.size,
        status: 'UPLOADED',
      },
    });

    return this.extractVersion(version);
  }

  async extractText(userId: string, versionId: string) {
    const version = await this.prisma.resumeVersion.findFirst({ where: { id: versionId, resume: { userId } } });
    if (!version) throw new NotFoundException('Resume version not found.');
    return this.extractVersion(version);
  }

  private async extractVersion(version: ResumeVersion) {
    await this.prisma.resumeVersion.update({ where: { id: version.id }, data: { status: 'EXTRACTION_QUEUED' } });

    try {
      const result = await pdf(await this.storage.read(version.storageKey));
      const extracted = await this.prisma.resumeVersion.update({
        where: { id: version.id },
        data: { extractedText: result.text.trim(), status: 'EXTRACTED' },
      });
      await this.ats.analyzeVersion(extracted.id);
      return extracted;
    } catch {
      return this.prisma.resumeVersion.update({ where: { id: version.id }, data: { status: 'FAILED' } });
    }
  }
}
