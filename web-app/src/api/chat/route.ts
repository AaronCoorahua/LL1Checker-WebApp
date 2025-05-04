// web-app/src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Tu prompt de sistema completo:
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

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "user",   parts: [{ text: prompt       }] },
    ],
  });
  return NextResponse.json({ text: response.text });
}
