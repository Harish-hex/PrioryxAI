"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Code, MessageSquare, StickyNote } from "lucide-react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse flex items-center justify-center"><p className="text-slate-400">Loading Editor...</p></div>
});

export default function CollabRoomPage({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { sender: "you", text: chatInput.trim() }]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/career/collab/match" className="text-neutral-500 hover:text-slate-900">
            <ArrowLeft size={18} />
          </a>
          <h1 className="text-sm font-semibold">Collaboration Room</h1>
          <span className="text-[10px] text-neutral-600 font-mono">{params.sessionId.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-12 h-[calc(100vh-49px)]">
        {/* Code Editor Panel */}
        <div className="col-span-8 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200 text-xs font-semibold flex items-center gap-2 text-neutral-500">
            <Code size={14} /> Shared Editor
          </div>
          <div className="flex-1 bg-white relative">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="light"
              defaultValue={`// Shared code editor
// Real-time sync via Supabase Realtime channels (coming soon)

function main() {
  console.log("Collaborative coding session with live peers");
}
`}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "var(--font-geist-mono)",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Right Sidebar: Chat + Notes */}
        <div className="col-span-4 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "chat" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-neutral-500"
              }`}
            >
              <MessageSquare size={12} /> Chat
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "notes" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-neutral-500"
              }`}
            >
              <StickyNote size={12} /> Notes
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-2.5 text-xs ${
                      msg.sender === "you"
                        ? "bg-indigo-500/10 border border-indigo-500/20 ml-4"
                        : "bg-slate-50 border border-slate-200 mr-4"
                    }`}
                  >
                    <span className="text-[10px] text-neutral-500 block mb-0.5">{msg.sender}</span>
                    {msg.text}
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-slate-200 p-2 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-neutral-600 outline-none"
                />
                <button onClick={sendMessage} className="text-indigo-400 hover:text-indigo-300">
                  <Send size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 p-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shared session notes..."
                className="w-full h-full bg-transparent text-sm text-slate-900 placeholder-neutral-600 outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
