import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const SKILLS = ['javascript', 'typescript', 'react', 'node.js', 'node', 'python', 'java', 'sql', 'git', 'docker', 'testing', 'aws'];
const SECTIONS = ['summary', 'experience', 'education', 'skills', 'projects'];

@Injectable()
export class AtsService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeVersion(versionId: string) {
    const version = await this.prisma.resumeVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException('Resume version not found.');

    const text = (version.extractedText ?? '').toLowerCase();
    const matchedKeywords = SKILLS.filter((skill) => text.includes(skill));
    const missingKeywords = SKILLS.filter((skill) => !matchedKeywords.includes(skill));
    const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);
    const hasPhone = /(?:\+?\d[\d ()-]{7,}\d)/.test(text);
    const foundSections = SECTIONS.filter((section) => text.includes(section));
    const strengths = [...(hasEmail && hasPhone ? ['Contact details are present.'] : []), ...(foundSections.length >= 3 ? ['Core resume sections are well represented.'] : []), ...(matchedKeywords.length >= 4 ? ['Relevant technical keywords are included.'] : [])];
    const improvements = [...(!hasEmail || !hasPhone ? ['Add a professional email address and phone number.'] : []), ...(foundSections.length < 3 ? ['Use clear sections for summary, experience, education, skills, and projects.'] : []), ...(missingKeywords.length > 0 ? [`Add relevant skills where truthful: ${missingKeywords.slice(0, 4).join(', ')}.`] : [])];
    const score = Math.min(100, Math.round((hasEmail && hasPhone ? 20 : 0) + (foundSections.length / SECTIONS.length) * 35 + (matchedKeywords.length / SKILLS.length) * 45));

    return this.prisma.resumeAnalysis.upsert({ where: { resumeVersionId: versionId }, create: { resumeVersionId: versionId, score, strengths, improvements, matchedKeywords, missingKeywords }, update: { score, strengths, improvements, matchedKeywords, missingKeywords } });
  }

  async getAnalysis(userId: string, versionId: string) {
    const analysis = await this.prisma.resumeAnalysis.findFirst({ where: { resumeVersionId: versionId, resumeVersion: { resume: { userId } } } });
    if (!analysis) throw new NotFoundException('ATS analysis is not available yet.');
    return analysis;
  }
}
