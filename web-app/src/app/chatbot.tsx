"use client";

import { useState } from "react";
import { MessageCircle, X, Copy } from "lucide-react";
import { marked } from "marked";
import { GoogleGenAI } from "@google/genai";

export default function Chatbot() {

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

  const SYSTEM_PROMPT = `
  Eres un asistente experto en gramáticas LL(1) y respondes siempre en español.

• Comprueba FIRST/FOLLOW y la tabla LL(1).  
• Si hay recursión izq. o conflictos, reescribe hasta que sea LL(1).  
• Devuelve sólo un bloque de código con la gramática válida.  
• La gramática debe tener la forma NonTerminal -> Token | Token, no le pongas ' ' a los tokens, cada token esta separado por espacio
por ejemplo ( expr ), son 3 tokens "(" "expr" ")" . Si token es un numero dejalo como numero, ejemplo no pongas zero, pon 0.
Y para epsilon, no pongas epsilon, pon el simbolo.
• Los no terminales Mandalos en mayusculas, y los terminales en minusculas siempre. Solo si no son simbolos Ejm: , ( ) ; etc.
Usa nombres en ingles 
• Si no existe forma LL(1): «No es posible construir una gramática LL(1) para esa descripción.»  
• Para cualquier otra pregunta: «Lo siento, solo puedo responder preguntas sobre gramáticas LL(1).»
  `;
  

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! ¿En qué puedo ayudarte con LL(1)?" },
  ]);
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => {
    if (open) {
      setMessages([{ from: "bot", text: "¡Hola! ¿En qué puedo ayudarte con LL(1)?" }]);
    }
    setOpen(!open);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { from: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    const reply = await askGemini(input);
    setLoading(false);
    setMessages(prev => [...prev, { from: "bot", text: reply }]);
  };

  async function askGemini(userPrompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user",   parts: [{ text: userPrompt     }] }
        ],
      });
      return response.text ?? "Lo siento, algo salió mal.";
    } catch (err) {
      console.error("GenAI error:", err);
      return "Lo siento, algo salió mal.";
    }
  }

  const extractCodeBlock = (text: string) => {
    const match = text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
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
            <span className="font-semibold">Chatbot LL(1)</span>
            <button onClick={toggleChat}><X /></button>
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
                      : "bg-blue-600 text-white self-end"
                  }`}
                >
                  {codeBlock ? (
                    <div className="relative">
                      <pre className="
                        text-xs font-mono whitespace-pre-wrap
                        bg-gray-100  text-black          /* modo claro */
                        dark:bg-gray-800 dark:text-gray-100 /* modo oscuro */
                        p-2 rounded
                      ">
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
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="p-2 rounded-md max-w-xs bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start animate-pulse">
                ...
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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