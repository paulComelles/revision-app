import type { SubjectId } from './types';

/** Tools shown on each subject page (contributed by modules). */
export interface SubjectTool {
  subject: SubjectId;
  to: string;
  label: string;
  desc: string;
  icon: string;
}

export const SUBJECT_TOOLS: SubjectTool[] = [];

export function registerTools(...tools: SubjectTool[]) {
  SUBJECT_TOOLS.push(...tools);
}
