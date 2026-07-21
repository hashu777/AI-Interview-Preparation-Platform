import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CodingLanguage, CodingSubmissionMode, CodingSubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Judge0ExecutorService } from './judge0-executor.service';

const problemSeed = {
  slug: 'two-sum-indices', title: 'Two Sum Indices', difficulty: 'EASY' as const,
  description: 'Read a JSON object from standard input with nums and target. Print a JSON array containing the indices of two numbers whose sum equals target. Example input: {"nums":[2,7,11,15],"target":9}. Expected output: [0,1].',
  cases: [
    { input: '{"nums":[2,7,11,15],"target":9}', output: '[0,1]', isHidden: false },
    { input: '{"nums":[3,2,4],"target":6}', output: '[1,2]', isHidden: false },
    { input: '{"nums":[3,3],"target":6}', output: '[0,1]', isHidden: true },
    { input: '{"nums":[-1,-2,-3,-4,-5],"target":-8}', output: '[2,4]', isHidden: true },
  ],
};
const starters: Record<CodingLanguage, string> = {
  JAVASCRIPT: "const fs = require('fs');\nconst { nums, target } = JSON.parse(fs.readFileSync(0, 'utf8'));\n\nfunction twoSum(nums, target) {\n  // Write your solution\n}\n\nconsole.log(JSON.stringify(twoSum(nums, target)));\n",
  PYTHON: "import sys, json\ndata = json.loads(sys.stdin.read())\nnums, target = data['nums'], data['target']\n\ndef two_sum(nums, target):\n    # Write your solution\n    pass\n\nprint(json.dumps(two_sum(nums, target)))\n",
  JAVA: "import java.io.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    // Read JSON from standard input and print the two indices as [i,j].\n  }\n}\n",
};

@Injectable()
export class CodingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly executor: Judge0ExecutorService) {}
  async onModuleInit() { await this.prisma.codingProblem.upsert({ where: { slug: problemSeed.slug }, create: { slug: problemSeed.slug, title: problemSeed.title, description: problemSeed.description, difficulty: problemSeed.difficulty, testCases: { create: problemSeed.cases } }, update: { title: problemSeed.title, description: problemSeed.description } }); }
  async list() { const problems = await this.prisma.codingProblem.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, slug: true, title: true, description: true, difficulty: true, testCases: { where: { isHidden: false }, select: { input: true, output: true } } } }); return problems; }
  async get(problemId: string) { const problem = await this.prisma.codingProblem.findUnique({ where: { id: problemId }, include: { testCases: { where: { isHidden: false }, select: { input: true, output: true } } } }); if (!problem) throw new NotFoundException('Coding problem not found.'); return { ...problem, starterCode: starters }; }
  async execute(userId: string, problemId: string, language: CodingLanguage, sourceCode: string, mode: CodingSubmissionMode) {
    const problem = await this.prisma.codingProblem.findUnique({ where: { id: problemId }, include: { testCases: { where: mode === 'RUN' ? { isHidden: false } : undefined } } });
    if (!problem) throw new NotFoundException('Coding problem not found.');
    const tests = problem.testCases;
    let passed = 0; let latest: { stdout?: string | null; stderr?: string | null; compile_output?: string | null; time?: string | null; memory?: number | null; status?: { id: number; description: string } } | undefined;
    let status: CodingSubmissionStatus = 'ACCEPTED';
    let executorError: string | null = null;
    try {
      for (const test of tests) { latest = await this.executor.execute(language, sourceCode, test.input, test.output); if (latest.status?.id === 3) passed += 1; else { status = latest.status?.id === 6 ? 'COMPILATION_ERROR' : latest.status?.id === 5 ? 'TIME_LIMIT_EXCEEDED' : latest.status?.id && latest.status.id >= 7 ? 'RUNTIME_ERROR' : 'WRONG_ANSWER'; break; } }
    } catch (error) {
      status = 'EXECUTOR_UNAVAILABLE';
      executorError = error instanceof Error ? error.message : 'Code executor is unavailable.';
    }
    const complexity = this.complexity(sourceCode);
    const submission = await this.prisma.codingSubmission.create({ data: { userId, problemId, language, sourceCode, mode, status, passedTestCases: passed, totalTestCases: tests.length, stdout: latest?.stdout ?? null, stderr: latest?.stderr ?? latest?.compile_output ?? executorError, executionTimeMs: latest?.time ? Math.round(Number(latest.time) * 1000) : null, memoryKb: latest?.memory ?? null, timeComplexity: complexity.value, complexityFeedback: complexity.feedback } });
    return submission;
  }
  private complexity(source: string) { const loops = (source.match(/\b(for|while)\b/g) ?? []).length; if (/\.sort\s*\(/.test(source)) return { value: 'O(n log n)', feedback: 'Sorting is detected. This is usually efficient, but a hash-map approach can solve Two Sum in O(n).' }; if (loops >= 2) return { value: 'O(n²) estimated', feedback: 'Nested iteration is likely quadratic. For Two Sum, use a hash map to reach O(n) time.' }; if (loops === 1) return { value: 'O(n) estimated', feedback: 'A single pass is detected. For this problem, a hash map gives O(n) time and O(n) space.' }; return { value: 'Not enough structure to estimate', feedback: 'Add a complete solution before relying on a complexity estimate.' }; }
}
