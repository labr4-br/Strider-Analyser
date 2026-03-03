import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { StrideAnalysis } from '../schemas/stride';

export function useFollowUpChat(analysisContext: StrideAnalysis | null) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: {
          analysisContext,
        },
      }),
    [analysisContext],
  );

  const chat = useChat({ transport });

  return chat;
}
