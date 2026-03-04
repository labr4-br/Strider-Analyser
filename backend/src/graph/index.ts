import { StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { StrideStateAnnotation, StrideState } from './state';
import { understandArchitecture } from './nodes/understand';
import { humanValidation } from './nodes/validate';
import { strideAnalysis } from './nodes/analyze';
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
  .addNode('generate_questions', generateQuestions)
  .addNode('chat', chat)
  .addEdge(START, 'understand_architecture')
  .addEdge('understand_architecture', 'human_validation')
  .addConditionalEdges('human_validation', routeAfterValidation, {
    understand_architecture: 'understand_architecture',
    stride_analysis: 'stride_analysis',
  })
  .addEdge('stride_analysis', 'generate_questions')
  .addEdge('generate_questions', 'chat')
  .addEdge('chat', END)
  .compile({ checkpointer });

export function createStrideGraph() {
  return compiledGraph;
}
