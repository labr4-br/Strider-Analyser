import { interrupt } from '@langchain/langgraph';
import { StrideState } from '../state';

interface ValidationResume {
  action: 'approve' | 'correct';
  feedback?: string;
}

export async function humanValidation(state: StrideState): Promise<Partial<StrideState>> {
  const response = interrupt({
    architectureDescription: state.architectureDescription,
  }) as ValidationResume;

  if (response.action === 'correct') {
    return {
      validationStatus: 'corrected' as const,
      userFeedback: response.feedback ?? '',
      phase: 'validating' as const,
    };
  }

  return {
    validationStatus: 'approved' as const,
    phase: 'validating' as const,
  };
}
