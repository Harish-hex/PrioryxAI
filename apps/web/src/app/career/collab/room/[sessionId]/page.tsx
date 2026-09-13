"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Code, MessageSquare, StickyNote, Users } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full neu-inset rounded-2xl flex items-center justify-center p-8">
      <p className="text-xs font-semibold text-slate-400">Loading Shared Code Editor...</p>
    </div>
  )
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
    <div className="space-y-6">
      {/* Header */}
      <header className="neu-card rounded-[28px] p-5 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/career/collab/match"
            className="neu-btn p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-purple-500" />
              <h1 className="text-base font-bold text-slate-950 dark:text-white">Peer Collaboration Room</h1>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">Session: {params.sessionId.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="neu-pill rounded-full px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Connected
          </span>
        </div>
      </header>

      {/* Two Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[560px]">
        {/* Code Editor Panel */}
        <div className="lg:col-span-8 neu-card rounded-[28px] p-5 flex flex-col h-[420px] lg:h-full">
          <div className="pb-3 border-b border-slate-200/60 dark:border-white/10 text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Code size={15} className="text-purple-500" />
            <span>Shared Real-Time Editor</span>
          </div>
          <div className="neu-inset rounded-2xl flex-1 overflow-hidden my-3 p-2">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              defaultValue={`// Shared real-time code editor
// Real-time synchronization active with connected peer

function solution(input) {
  // Collaborate and solve here
  return input;
}
`}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "var(--font-geist-mono)",
                lineHeight: 22,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Right Sidebar: Chat + Notes */}
        <div className="lg:col-span-4 neu-card rounded-[28px] p-5 flex flex-col h-[300px] lg:h-full">
          {/* Tab Switcher */}
          <div className="neu-inset rounded-2xl p-1 flex items-center gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "chat" ? "neu-card text-purple-700 dark:text-purple-300 bg-white dark:bg-white/10" : "text-slate-500"
              }`}
            >
              <MessageSquare size={13} /> Chat
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "notes" ? "neu-card text-purple-700 dark:text-purple-300 bg-white dark:bg-white/10" : "text-slate-500"
              }`}
            >
              <StickyNote size={13} /> Notes
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 my-2">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Send a message to your peer...
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl p-2.5 text-xs ${
                        msg.sender === "you"
                          ? "neu-pill bg-purple-500/10 text-purple-900 dark:text-purple-200 ml-4"
                          : "neu-inset text-slate-700 dark:text-slate-300 mr-4"
                      }`}
                    >
                      <span className="text-[10px] opacity-70 block mb-0.5">{msg.sender}</span>
                      {msg.text}
                    </motion.div>
                  ))
                )}
              </div>
              <div className="neu-inset rounded-2xl p-1.5 flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                <button onClick={sendMessage} className="neu-btn p-2 rounded-xl text-purple-600 dark:text-purple-400">
                  <Send size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 my-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shared scratchpad notes for this session..."
                className="neu-inset w-full h-full rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
