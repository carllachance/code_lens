import { CodeEdge } from './edges';
import { CodeNode } from './nodes';

export type QuestionTraceStep = {
  fromNodeId: string;
  toNodeId: string;
  edgeType: CodeEdge['edgeType'];
  detail?: string;
  sourceFilePath: string;
  sourceStartLine?: number;
};

export type QuestionTracePath = {
  title: string;
  startNodeId: string;
  endNodeId: string;
  steps: QuestionTraceStep[];
};

export type QuestionHighlight = {
  nodeId: string;
  name: string;
  kind: CodeNode['kind'];
  filePath: string;
  whyItMatters: string;
};

export type QuestionAnswer = {
  question: string;
  directAnswer: string;
  plainEnglishWalkthrough: string[];
  highlights: QuestionHighlight[];
  tracePaths: QuestionTracePath[];
  followUps: string[];
};
