"use client";

import { useState } from "react";
import { MessageCircle, X, Copy } from "lucide-react";
import { marked } from "marked";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! ¿En qué puedo ayudarte con LL(1)?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleChat = () => {
    if (open) {
      setMessages([{ from: "bot", text: "¡Hola! ¿En qué puedo ayudarte con LL(1)?" }]);
    }
    setOpen(!open);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    const reply = await askGemini(input);
    setLoading(false);
    setMessages(prev => [...prev, { from: "bot", text: reply }]);
  };

  async function askGemini(prompt: string): Promise<string> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return "Lo siento, algo salió mal.";
    const { text } = await res.json();
    return text;
  }

  const extractCodeBlock = (text: string) => {
    const m = text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    return m ? m[1].trim() : null;
  };

  const handleCopy = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div>
      {!open && (
        <button
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
          onClick={toggleChat}
        >
          <MessageCircle size={34} />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-gray-900 border rounded-xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-300">
            <span className="font-semibold">Chatbot LL(1)</span>
            <button onClick={toggleChat}><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg, i) => {
              const isBot = msg.from === "bot";
              const code = isBot ? extractCodeBlock(msg.text) : null;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-md max-w-xs break-words ${
                    isBot
                      ? "bg-gray-200 dark:bg-gray-700 self-start"
                      : "bg-blue-600 text-white self-end"
                  }`}
                >
                  {code ? (
                    <div className="relative">
                      <pre className="p-2 bg-gray-100 dark:bg-gray-800 font-mono text-xs rounded">
                        {code}
                      </pre>
                      <button
                        className="absolute top-1 right-1 text-xs bg-gray-300 hover:bg-gray-400 rounded px-1 py-0.5"
                        onClick={() => handleCopy(code, i)}
                      >
                        {copiedIndex === i ? "Copiado" : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="animate-pulse p-2 bg-gray-200 dark:bg-gray-700 rounded-md">
                …
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-300 flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white rounded px-3 py-1 text-sm hover:bg-blue-700"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
