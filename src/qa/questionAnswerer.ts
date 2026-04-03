import { CodeEdge } from '../contracts/edges';
import { CodeNode } from '../contracts/nodes';
import { QuestionAnswer, QuestionHighlight, QuestionTracePath, QuestionTraceStep } from '../contracts/qa';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'is', 'are', 'be', 'it', 'this', 'that', 'with', 'by', 'what',
  'where', 'how', 'when', 'why', 'who', 'can', 'i', 'we', 'you', 'app', 'application', 'code', 'does', 'do', 'from', 'at'
]);

type CorpusItem = {
  node: CodeNode;
  text: string;
  vector: Map<string, number>;
  norm: number;
};

export function answerWorkspaceQuestion(question: string, nodes: CodeNode[], edges: CodeEdge[]): QuestionAnswer {
  const cleanQuestion = question.trim();
  const keywords = tokenize(cleanQuestion).filter((token) => !STOP_WORDS.has(token));
  const idf = computeIdf(nodes, edges);
  const corpus = buildCorpus(nodes, edges, idf);
  const queryVector = buildVector(keywords, idf);
  const queryNorm = vectorNorm(queryVector);

  const ranked = corpus
    .map((item) => ({ item, score: cosineSimilarity(item.vector, item.norm, queryVector, queryNorm) }))
    .sort((a, b) => b.score - a.score);

  const topNodes = ranked.filter((entry) => entry.score > 0).slice(0, 5).map((entry) => entry.item.node);
  const fallbackNodes = topNodes.length ? topNodes : nodes.slice(0, 5);

  const tracePaths = buildTracePaths(fallbackNodes, nodes, edges, keywords);
  const highlights = buildHighlights(fallbackNodes, edges, keywords);
  const directAnswer = buildDirectAnswer(cleanQuestion, highlights, tracePaths);
  const plainEnglishWalkthrough = buildWalkthrough(highlights, tracePaths);

  return {
    question: cleanQuestion,
    directAnswer,
    plainEnglishWalkthrough,
    highlights,
    tracePaths,
    followUps: buildFollowUps(fallbackNodes)
  };
}

function buildCorpus(nodes: CodeNode[], edges: CodeEdge[], idf: Map<string, number>): CorpusItem[] {
  const outgoingByNode = new Map<string, CodeEdge[]>();
  for (const edge of edges) {
    const existing = outgoingByNode.get(edge.fromNodeId);
    if (existing) {
      existing.push(edge);
    } else {
      outgoingByNode.set(edge.fromNodeId, [edge]);
    }
  }

  return nodes.map((node) => {
    const outgoing = outgoingByNode.get(node.id) ?? [];
    const edgeSummary = outgoing
      .slice(0, 8)
      .map((edge) => `${edge.edgeType} ${edge.detail ?? ''}`)
      .join(' ');
    const text = `${node.name} ${node.kind} ${node.filePath} ${node.modulePath ?? ''} ${node.signature ?? ''} ${node.responsibility} ${edgeSummary}`;
    const vector = buildVector(tokenize(text), idf);
    return {
      node,
      text,
      vector,
      norm: vectorNorm(vector)
    };
  });
}

function computeIdf(nodes: CodeNode[], edges: CodeEdge[]): Map<string, number> {
  const docs: string[] = [];
  const outgoingByNode = new Map<string, CodeEdge[]>();
  for (const edge of edges) {
    const existing = outgoingByNode.get(edge.fromNodeId);
    if (existing) {
      existing.push(edge);
    } else {
      outgoingByNode.set(edge.fromNodeId, [edge]);
    }
  }

  for (const node of nodes) {
    const outgoing = outgoingByNode.get(node.id) ?? [];
    docs.push(`${node.name} ${node.kind} ${node.filePath} ${node.signature ?? ''} ${node.responsibility} ${outgoing.map((edge) => edge.edgeType).join(' ')}`);
  }

  const docCount = docs.length || 1;
  const documentFrequency = new Map<string, number>();
  for (const doc of docs) {
    for (const token of new Set(tokenize(doc))) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, count] of documentFrequency.entries()) {
    idf.set(token, Math.log((1 + docCount) / (1 + count)) + 1);
  }
  return idf;
}

function buildVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const vector = new Map<string, number>();
  const maxCount = Math.max(...counts.values(), 1);
  for (const [token, count] of counts.entries()) {
    const tf = count / maxCount;
    const weight = tf * (idf.get(token) ?? 0.6);
    vector.set(token, weight);
  }
  return vector;
}

function cosineSimilarity(a: Map<string, number>, aNorm: number, b: Map<string, number>, bNorm: number): number {
  if (!aNorm || !bNorm) {
    return 0;
  }

  let dot = 0;
  for (const [token, value] of a.entries()) {
    dot += value * (b.get(token) ?? 0);
  }

  return dot / (aNorm * bNorm);
}

function vectorNorm(vector: Map<string, number>): number {
  let sum = 0;
  for (const value of vector.values()) {
    sum += value * value;
  }
  return Math.sqrt(sum);
}

function buildTracePaths(seeds: CodeNode[], nodes: CodeNode[], edges: CodeEdge[], keywords: string[]): QuestionTracePath[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingByNode = new Map<string, CodeEdge[]>();
  for (const edge of edges) {
    const existing = outgoingByNode.get(edge.fromNodeId);
    if (existing) {
      existing.push(edge);
    } else {
      outgoingByNode.set(edge.fromNodeId, [edge]);
    }
  }

  const traces: QuestionTracePath[] = [];
  for (const seed of seeds.slice(0, 3)) {
    const path = bfsTrace(seed.id, outgoingByNode, nodeById, keywords, 4);
    if (!path.length) {
      continue;
    }

    const endNodeId = path[path.length - 1].toNodeId;
    const endNode = nodeById.get(endNodeId);
    traces.push({
      title: `${seed.name} flow${endNode ? ` → ${endNode.name}` : ''}`,
      startNodeId: seed.id,
      endNodeId,
      steps: path
    });
  }

  return traces;
}

function bfsTrace(
  startNodeId: string,
  outgoingByNode: Map<string, CodeEdge[]>,
  nodeById: Map<string, CodeNode>,
  keywords: string[],
  maxDepth: number
): QuestionTraceStep[] {
  const queue: Array<{ nodeId: string; path: CodeEdge[]; depth: number }> = [{ nodeId: startNodeId, path: [], depth: 0 }];
  const visited = new Set<string>([startNodeId]);

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.path.length) {
      const lastEdge = current.path[current.path.length - 1];
      const target = nodeById.get(lastEdge.toNodeId);
      const text = `${target?.name ?? ''} ${target?.filePath ?? ''}`.toLowerCase();
      if (keywords.some((keyword) => text.includes(keyword)) || target?.kind === 'route' || target?.kind === 'store') {
        return current.path.map(toTraceStep);
      }
    }

    if (current.depth >= maxDepth) {
      continue;
    }

    const outgoing = outgoingByNode.get(current.nodeId) ?? [];
    for (const edge of outgoing) {
      if (visited.has(edge.toNodeId)) {
        continue;
      }
      visited.add(edge.toNodeId);
      queue.push({ nodeId: edge.toNodeId, path: [...current.path, edge], depth: current.depth + 1 });
    }
  }

  return [];
}

function toTraceStep(edge: CodeEdge): QuestionTraceStep {
  return {
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    edgeType: edge.edgeType,
    detail: edge.detail,
    sourceFilePath: edge.sourceFilePath,
    sourceStartLine: edge.sourceStartLine
  };
}

function buildHighlights(nodes: CodeNode[], edges: CodeEdge[], keywords: string[]): QuestionHighlight[] {
  const incomingCount = new Map<string, number>();
  for (const edge of edges) {
    incomingCount.set(edge.toNodeId, (incomingCount.get(edge.toNodeId) ?? 0) + 1);
  }

  return nodes.slice(0, 5).map((node) => {
    const incoming = incomingCount.get(node.id) ?? 0;
    const keywordMatch = keywords.some((keyword) => `${node.name} ${node.filePath}`.toLowerCase().includes(keyword));
    return {
      nodeId: node.id,
      name: node.name,
      kind: node.kind,
      filePath: node.filePath,
      whyItMatters: keywordMatch
        ? 'Direct keyword match from your question.'
        : incoming > 8
          ? `This node is highly referenced (${incoming} incoming links).`
          : 'This node is connected to the question context.'
    };
  });
}

function buildDirectAnswer(question: string, highlights: QuestionHighlight[], traces: QuestionTracePath[]): string {
  if (!highlights.length) {
    return `I could not find a strong graph match for "${question}" yet. Try reindexing and asking with concrete nouns like file names, function names, or user actions.`;
  }

  const anchor = highlights[0];
  const traceSummary = traces[0]
    ? `The strongest flow starts at ${anchor.name} and travels ${traces[0].steps.length} step(s) through the app wiring.`
    : `The strongest anchor is ${anchor.name}, but there was no multi-step flow available in the current graph.`;

  return `${anchor.name} (${anchor.kind}) is the best starting point for your question. ${traceSummary} I then explain each step in plain language below.`;
}

function buildWalkthrough(highlights: QuestionHighlight[], traces: QuestionTracePath[]): string[] {
  const lines: string[] = [];
  for (const highlight of highlights.slice(0, 3)) {
    lines.push(`${highlight.name} in ${highlight.filePath} matters because ${highlight.whyItMatters.toLowerCase()}`);
  }

  for (const trace of traces.slice(0, 2)) {
    lines.push(`Trace: ${trace.title}`);
    for (const [index, step] of trace.steps.entries()) {
      lines.push(
        `Step ${index + 1}: ${step.fromNodeId} ${edgePhrase(step.edgeType)} ${step.toNodeId} (source: ${step.sourceFilePath}${step.sourceStartLine ? `:${step.sourceStartLine}` : ''}).`
      );
    }
  }

  if (!lines.length) {
    lines.push('No walkthrough steps were generated. Reindex to refresh graph coverage.');
  }

  return lines;
}

function buildFollowUps(nodes: CodeNode[]): string[] {
  const base = nodes.slice(0, 3).map((node) => `What can break if ${node.name} changes?`);
  return [
    ...base,
    'Where is the first entry point from UI into domain logic?',
    'Which part writes data to storage or sends network requests?'
  ].slice(0, 4);
}

function edgePhrase(edgeType: CodeEdge['edgeType']): string {
  switch (edgeType) {
    case 'calls':
      return 'calls';
    case 'renders':
      return 'renders';
    case 'uses_hook':
      return 'uses hook';
    case 'reads_state':
      return 'reads state from';
    case 'writes_state':
      return 'writes state to';
    case 'dispatches':
      return 'dispatches action to';
    case 'handles_route':
      return 'handles route via';
    case 'makes_request_to':
      return 'makes request to';
    case 'persists_to':
      return 'persists data through';
    default:
      return edgeType.replace(/_/g, ' ');
  }
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}
