import { useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { StrideAnalysis } from '../schemas/stride';

export function useFollowUpChat(analysisContext: StrideAnalysis | null) {
  const contextRef = useRef(analysisContext);
  contextRef.current = analysisContext;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          analysisContext: contextRef.current,
        }),
      }),
    [],
  );

  const chat = useChat({ transport });

  return chat;
}
