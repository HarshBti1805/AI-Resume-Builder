"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { ContextTools } from "./ContextTools";

export function ChatPanel({ resumeId }: { resumeId: string }) {
  const messages = useAgentStore((s) => s.messages);
  const streaming = useAgentStore((s) => s.streaming);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const loadConversation = useAgentStore((s) => s.loadConversation);
  const loadSnapshots = useAgentStore((s) => s.loadSnapshots);
  const loadArtifacts = useAgentStore((s) => s.loadArtifacts);

  useEffect(() => {
    if (!resumeId) return;
    loadConversation(resumeId);
    loadSnapshots(resumeId);
    loadArtifacts(resumeId);
  }, [resumeId, loadConversation, loadSnapshots, loadArtifacts]);

  const send = (text: string) => {
    void sendMessage(resumeId, text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageList
        messages={messages}
        streaming={streaming}
        onSuggestion={send}
      />
      <ContextTools resumeId={resumeId} onSend={send} disabled={streaming} />
      <Composer onSend={send} disabled={streaming} />
    </div>
  );
}
