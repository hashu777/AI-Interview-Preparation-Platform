import { Injectable } from '@nestjs/common';
import { InterviewDifficulty, InterviewDomain } from '@prisma/client';

const technical = [
  'Explain a recent technical project. What problem did it solve and what was your contribution?',
  'How would you design a reliable API for a feature used by many users?',
  'Describe a difficult bug you diagnosed. How did you narrow down the root cause?',
  'What trade-offs would you consider when choosing a database for a new application?',
  'How do you make sure your code is maintainable and well tested?',
  'Describe a time you improved the performance, quality, or reliability of a system.',
  'How would you approach learning an unfamiliar technology for a project deadline?',
  'What security concerns do you consider before releasing a web application?',
];
const hr = [
  'Tell me about yourself and the kind of role you are looking for.',
  'Describe a time you worked through a disagreement with a teammate.',
  'Tell me about a challenging situation and how you handled it.',
  'What motivates you to do your best work?',
  'Describe a time you received feedback and what you changed afterwards.',
  'How do you prioritize when you have multiple deadlines?',
  'Why are you interested in this role and company?',
  'What achievement are you most proud of, and why?',
];

@Injectable()
export class InterviewQuestionService {
  generate(domain: InterviewDomain, difficulty: InterviewDifficulty, count: number) {
    const bank = domain === 'TECHNICAL' ? technical : hr;
    const prefix = difficulty === 'EASY' ? 'Give a clear example. ' : difficulty === 'HARD' ? 'Discuss your reasoning, alternatives, and trade-offs. ' : 'Use a structured example and explain your reasoning. ';
    return Array.from({ length: count }, (_, position) => ({ position, prompt: `${prefix}${bank[position % bank.length]}` }));
  }
}
