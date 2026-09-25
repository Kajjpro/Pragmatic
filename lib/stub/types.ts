export type FlagLevel = "HIGH" | "MEDIUM" | "LOW" | "OK";
export type Decision = "correct" | "wrong" | "pending";
export type ReportStatus = "queued" | "reviewing" | "published";

export type Directive = {
  id: string;
  code: string;
  goal: string;
  owner: string;
  deadline: string;
  ownerScore: number;
  auditorScore: number;
  flag: FlagLevel;
  decision: Decision;
  reasons: string[];
  fullText: string;
  quote: string;
  concerns: string[];
  evidenceClusters: EvidenceCluster[];
  lawId: string;
  status: "on-track" | "at-risk" | "off-track" | "done";
};

export type EvidenceCluster = {
  id: string;
  label: string;
  count: number;
  summary: string;
  response?: string;
};

export type Report = {
  id: string;
  agency: string;
  period: string;
  type: string;
  status: ReportStatus;
  submittedAt: string;
  flagCounts: { HIGH: number; MEDIUM: number; LOW: number };
  totalRows: number;
  previousReportId?: string;
  directives: Directive[];
};

export type LawClause = {
  id: string;
  number: string;
  originalText: string;
  plainText: string;
  opinionCounts: { support: number; oppose: number; neutral: number };
  clusters: OpinionCluster[];
};

export type OpinionCluster = {
  id: string;
  label: string;
  stance: "support" | "oppose" | "neutral";
  count: number;
  summary: string;
  response?: string;
};

export type Law = {
  id: string;
  title: string;
  category: string;
  stage: "draft" | "debate" | "passed" | "implementation";
  followers: number;
  updatedAt: string;
  summary: string;
  keyPoints: string[];
  affected: string[];
  clauses: LawClause[];
  vote: { support: number; oppose: number; neutral: number; total: number };
  siteVote: { support: number; oppose: number; neutral: number; total: number };
  directiveIds: string[];
};
