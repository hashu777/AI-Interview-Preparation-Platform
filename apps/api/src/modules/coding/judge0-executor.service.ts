import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CodingLanguage } from '@prisma/client';

type JudgeResult = { stdout?: string | null; stderr?: string | null; compile_output?: string | null; message?: string | null; time?: string | null; memory?: number | null; status?: { id: number; description: string } };

@Injectable()
export class Judge0ExecutorService {
  private readonly baseUrl = (process.env.CODE_EXECUTOR_URL ?? 'http://localhost:2358').replace(/\/$/, '');
  private languageIds = new Map<CodingLanguage, number>();

  private async languageId(language: CodingLanguage) {
    const cached = this.languageIds.get(language);
    if (cached) return cached;
    let response: Response;
    try { response = await fetch(`${this.baseUrl}/languages`, { signal: AbortSignal.timeout(4000) }); } catch { throw new ServiceUnavailableException('Code executor is unavailable. Start the Judge0 Docker service.'); }
    if (!response.ok) throw new ServiceUnavailableException('Code executor is unavailable.');
    const languages = await response.json() as Array<{ id: number; name: string }>;
    const matchers: Record<CodingLanguage, RegExp> = { JAVASCRIPT: /^JavaScript \(Node\.js/, PYTHON: /^Python \(3/, JAVA: /^Java \(OpenJDK/ };
    const selected = languages.find((item) => matchers[language].test(item.name));
    if (!selected) throw new ServiceUnavailableException(`${language} is not enabled in the code executor.`);
    this.languageIds.set(language, selected.id);
    return selected.id;
  }

  async execute(language: CodingLanguage, sourceCode: string, input: string, expectedOutput: string): Promise<JudgeResult> {
    const languageId = await this.languageId(language);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ language_id: languageId, source_code: sourceCode, stdin: input, expected_output: expectedOutput, cpu_time_limit: 2, wall_time_limit: 5, memory_limit: 128000, enable_network: false }),
      });
    } catch { throw new ServiceUnavailableException('Code executor did not respond in time.'); }
    if (!response.ok) throw new ServiceUnavailableException('Code executor rejected this execution request.');
    const result = await response.json() as JudgeResult;

    // Judge0 1.13.x relies on cgroup v1. Docker Desktop on modern Windows hosts
    // uses cgroup v2, which makes Isolate report a misleading missing /box file.
    // Treat this as executor infrastructure being unavailable, never as a learner's
    // runtime error.
    if (result.status?.id === 13 && /cgroup|\/box\//i.test(result.message ?? '')) {
      throw new ServiceUnavailableException(
        'The local code executor is incompatible with this Docker host. Configure a Linux cgroup-v1 Judge0 host and set CODE_EXECUTOR_URL to it.',
      );
    }

    return result;
  }
}
