import { StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { StrideStateAnnotation, StrideState } from './state';
import { understandArchitecture } from './nodes/understand';
import { humanValidation } from './nodes/validate';
import { strideAnalysis } from './nodes/analyze';
import { enrichThreats } from './nodes/enrich';
import { eisenhowerPrioritization } from './nodes/prioritize';
import { generateQuestions } from './nodes/questions';
import { chat } from './nodes/chat';

function routeAfterValidation(state: StrideState): string {
  if (state.validationStatus === 'corrected') {
    return 'understand_architecture';
  }
  return 'stride_analysis';
}

const checkpointer = new MemorySaver();

const compiledGraph = new StateGraph(StrideStateAnnotation)
  .addNode('understand_architecture', understandArchitecture)
  .addNode('human_validation', humanValidation)
  .addNode('stride_analysis', strideAnalysis)
  .addNode('enrich_threats', enrichThreats)
  .addNode('eisenhower_prioritization', eisenhowerPrioritization)
  .addNode('generate_questions', generateQuestions)
  .addNode('chat', chat)
  .addEdge(START, 'understand_architecture')
  .addEdge('understand_architecture', 'human_validation')
  .addConditionalEdges('human_validation', routeAfterValidation, {
    understand_architecture: 'understand_architecture',
    stride_analysis: 'stride_analysis',
  })
  // Fan-out: 3 parallel branches after stride_analysis
  .addEdge('stride_analysis', 'enrich_threats')
  .addEdge('stride_analysis', 'eisenhower_prioritization')
  .addEdge('stride_analysis', 'generate_questions')
  // Fan-in: all 3 converge into chat
  .addEdge('enrich_threats', 'chat')
  .addEdge('eisenhower_prioritization', 'chat')
  .addEdge('generate_questions', 'chat')
  .addEdge('chat', END)
  .compile({ checkpointer });

export function createStrideGraph() {
  return compiledGraph;
}
