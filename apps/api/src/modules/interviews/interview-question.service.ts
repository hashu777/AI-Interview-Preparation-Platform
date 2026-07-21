import { Injectable } from '@nestjs/common';
import { InterviewCompany, InterviewDifficulty, InterviewDomain } from '@prisma/client';

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

const companyQuestions: Record<InterviewCompany, Record<InterviewDomain, string[]>> = {
  GOOGLE: { TECHNICAL: ['Google values scalable, user-focused systems. Design a service that serves personalised search suggestions at scale.', 'How would you make a data-heavy feature fast, reliable, and observable for users around the world?', 'Explain how you would evaluate competing technical designs before committing to one.'], HR: ['Why Google, and how would you create impact for users in this role?', 'Tell me about a time you used data or user feedback to challenge an assumption.', 'Describe a collaboration where you helped a diverse team reach a better solution.'] },
  AMAZON: { TECHNICAL: ['Design an order-status service that stays reliable during a peak sale event.', 'How would you investigate and prevent a production issue affecting a customer-facing workflow?', 'Describe a technical decision where you balanced speed of delivery with long-term reliability.'], HR: ['Tell me about a time you showed ownership beyond your assigned task.', 'Describe a situation where you earned customer trust through a difficult decision.', 'Give an example of when you disagreed with a decision, then committed to the outcome.'] },
  MICROSOFT: { TECHNICAL: ['Design a collaborative feature that remains consistent across desktop, web, and mobile clients.', 'How would you build inclusive, accessible behaviour into a new product feature?', 'Explain how you would diagnose a reliability issue reported by enterprise customers.'], HR: ['Tell me about a time you demonstrated a growth mindset after feedback.', 'How have you enabled another person or team to be successful?', 'Describe a time you worked across teams with different priorities.'] },
  INFOSYS: { TECHNICAL: ['How would you understand an unfamiliar client system before proposing a change?', 'Describe an approach for delivering a secure API integration for an enterprise client.', 'How would you keep quality high while delivering a project with a fixed timeline?'], HR: ['Why are you interested in a client-facing technology career at Infosys?', 'Tell me about a time you adapted quickly to a new tool, team, or process.', 'Describe how you would communicate project risk to a non-technical stakeholder.'] },
  TCS: { TECHNICAL: ['How would you approach modernising a legacy application without disrupting business operations?', 'Explain your testing strategy for a feature used by a large enterprise customer base.', 'How would you structure a solution when requirements are initially incomplete?'], HR: ['Why TCS, and how do you see yourself growing in a consulting environment?', 'Describe a time you worked effectively in a team with a tight deadline.', 'Tell me about a time you took initiative to learn something needed for a project.'] },
  ACCENTURE: { TECHNICAL: ['How would you translate a business problem into a measurable technology solution?', 'Design a secure data flow for a client moving a workflow to the cloud.', 'How would you choose between buying, configuring, or building a software capability?'], HR: ['Tell me about a time you created value for a customer or stakeholder.', 'How would you manage changing priorities in a consulting project?', 'Describe a situation where you influenced others without formal authority.'] },
};

@Injectable()
export class InterviewQuestionService {
  generate(domain: InterviewDomain, difficulty: InterviewDifficulty, count: number, company?: InterviewCompany) {
    const bank = company ? companyQuestions[company][domain] : domain === 'TECHNICAL' ? technical : hr;
    const prefix = difficulty === 'EASY' ? 'Give a clear example. ' : difficulty === 'HARD' ? 'Discuss your reasoning, alternatives, and trade-offs. ' : 'Use a structured example and explain your reasoning. ';
    return Array.from({ length: count }, (_, position) => ({ position, prompt: `${prefix}${bank[position % bank.length]}` }));
  }
}
