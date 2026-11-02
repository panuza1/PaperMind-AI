export type Language = 'en' | 'th';

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface KeyFinding {
  metricOrFinding: string;
  result: string;
  pageReference: number | string;
  interpretation: string;
}

export interface MethodologyInfo {
  architecture: string;
  keyInnovations: string[];
  trainingOrExperimentalSetup: string;
}

export interface PaperSummary {
  title: string;
  executiveSummary: string;
  problemStatement: string;
  methodology: MethodologyInfo;
  keyFindings: KeyFinding[];
  strengths: string[];
  limitations: string[];
  practicalApplications: string[];
  keywords: string[];
  quickTakeaway: string;
  generatedAt?: string;
  language?: Language;
}

export interface Citation {
  page: number;
  quote: string;
  relevance: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  suggestedFollowUps?: string[];
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: string;
  abstract: string;
  totalPages: number;
  fileSize: number;
  uploadDate: string;
  pages: PageContent[];
  summary?: PaperSummary;
  chatHistory?: ChatMessage[];
  tags: string[];
  isStarred?: boolean;
  notes?: string;
  fileName?: string;
}

export interface DimensionAssessment {
  paperTitle: string;
  assessment: string;
  ratingOrHighlight: string;
}

export interface ComparisonDimension {
  dimension: string;
  paperAssessments: DimensionAssessment[];
}

export interface SelectionGuideItem {
  scenario: string;
  recommendedPaper: string;
  rationale: string;
}

export interface ComparisonResult {
  id: string;
  paperIds: string[];
  paperTitles: string[];
  comparisonTitle: string;
  synthesisOverview: string;
  dimensions: ComparisonDimension[];
  commonGround: string[];
  keyDivergences: string[];
  selectionGuide: SelectionGuideItem[];
  createdAt: string;
  language: Language;
}

export interface IdentifiedGap {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Moderate';
  gapDescription: string;
  whyItMatters: string;
  currentPaperLimitation: string;
  proposedHypothesis: string;
  suggestedMethodology: string;
  difficultyLevel: string;
}

export interface ResearchGapResult {
  id: string;
  paperIds: string[];
  paperTitles: string[];
  domainOverview: string;
  identifiedGaps: IdentifiedGap[];
  emergingTrends: string[];
  grantProposalHook: string;
  createdAt: string;
  language: Language;
}
