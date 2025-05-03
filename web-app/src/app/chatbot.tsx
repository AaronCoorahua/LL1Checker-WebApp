"use client";

import { useState } from "react";
import { MessageCircle, X, Copy } from "lucide-react";
import { marked } from "marked";

export default function Chatbot() {
  const SYSTEM_PROMPT = `Eres un asistente experto en gramáticas LL(1). Compiladores, parsers. Habla con normalidad sobre estos temas con respuestas resumidas
  , si te preguntaran otra cosa diles que solo sabes sobre lo que eres asistente y no des más detalle. Si alguien te pregunta por una gramática
  en específico le tienes que dar la respuesta en formado md solo la gramática para que la copie: S -> a b | a por ejemplo. Y antes
  de enviar una gramática, asegurate que cumple las reglas de gramáticas LL1`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleChat = () => {
    if (open) {
      setMessages([{ from: "bot", text: "¡Hola! ¿En qué puedo ayudarte?" }]);
    }
    setOpen(!open);
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const reply = await askGemini(input);
    const botMessage = { from: "bot", text: reply };
    setMessages((prev) => [...prev, botMessage]);
  };

  async function askGemini(userPrompt: string): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "user", parts: [{ text: userPrompt }] },
          ],
        }),
      }
    );

    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Lo siento, no tengo respuesta."
    );
  }

  const extractCodeBlock = (text: string) => {
    const match = text.match(/```([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
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
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700">
            <span className="font-semibold">Chatbot</span>
            <button onClick={toggleChat}>
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg, idx) => {
              const isBot = msg.from === "bot";
              const codeBlock = isBot ? extractCodeBlock(msg.text) : null;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-md max-w-xs whitespace-pre-wrap break-words ${
                    isBot
                      ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start"
                      : "bg-blue-600 text-white self-start"
                  }`}
                >
                  {codeBlock ? (
                    <div className="relative">
                      <pre className="text-xs bg-gray-100 p-2 rounded font-mono whitespace-pre-wrap">
                        {codeBlock}
                      </pre>
                      <button
                        className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-gray-300 hover:bg-gray-400 rounded"
                        onClick={() => handleCopy(codeBlock, idx)}
                      >
                        {copiedIndex === idx ? "Copiado" : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text)}} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Escribe tu mensaje..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
