"use client";

import { JSX, useEffect, useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import Tree from 'react-d3-tree';
import Chatbot from "./chatbot"


interface TraceEntry {
  stack: string[];
  input: string[];
  rule: string;
}
interface TreeNode {
  label: string;
  children?: TreeNode[];
}

interface ExplorePoint {
  pos:   number;
  nt:    string;
  token: string;
  rule:  string;
}

interface RecoverPoint {
  step:   number;   
  token:  string;
  non_terminal: string;
}

interface TraceResult {
  trace:          TraceEntry[];
  tree:           TreeNode;
  accepted:       boolean;          
  explore_points: ExplorePoint[];  
  extract_points: RecoverPoint[]; 
}


const toD3 = (n: TreeNode): any => ({
  name: n.label,
  children: n.children?.map(toD3) ?? [],
});

export default function GrammarSelector() {
  const examples = [
    { title: "Balanced 0's and 1's", grammar: `S -> 0 S 1 | ε` },
    { title: "List of ID's", grammar: `L  -> [ Items ]\nItems -> id Items'\nItems' -> , id Items' | ε`},
    { title: "AnBn", grammar: `S -> a S b | ε` },
    { title: "Simple Assignment", grammar: `S -> id = num ;` },
    { title: "Arithmetic Expressions", grammar: `E -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id` },
    { title: "Block of Statements", grammar: `Block -> { Stmts }\nStmts -> Stmt Stmts | ε\nStmt -> id = num ;` },
    { title: "Simple HTML", grammar: `HTML -> <tag> text </tag> | text` },
    { title: "Simple Loop", grammar: `Loop -> while ( Cond ) Stmt` },
    { title: "If-Else", grammar: `S -> if ( C ) S else S | assign` },
    { title: "Repeated AB Pattern", grammar: `S -> A S'\nS' -> B S' | ε\nA -> a\nB -> b` }
  ];

  const safeJoin = (val: unknown, sep = " ") =>
    Array.isArray(val) ? val.join(sep) : "";

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .custom-link {
        stroke: white !important;
        stroke-width: 2 !important;
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customGrammar, setCustomGrammar] = useState("");
  const [error, setError]   = useState("");
  const [result, setResult] = useState<any | null>(null);

  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  const [traceResult,setTraceResult] = useState<TraceResult | null>(null);

  const [inputString, setInputString] = useState("");
  const [maxSteps,   setMaxSteps]     = useState(100);

  const analyzeRef = useRef<HTMLDivElement | null>(null);
  const traceRef   = useRef<HTMLDivElement | null>(null);

  const grammarToPayload = () => {
    const lines = customGrammar.trim().split("\n");
    return {
      grammar: lines.map(l => {
        const [lhs, rhs] = l.split("->").map(p => p.trim());
        return { lhs, rhs: rhs.split(" | ").map(p => p.trim()) };
      }),
      start_symbol: lines[0]?.split("->")[0].trim() || ""
    };
  };


  const handleTraceTree = async () => {
    try {
      const res = await axios.post("api/grammar/run_input",
        { ...grammarToPayload(),
          input_string: inputString,
          max_steps: Math.max(1, maxSteps) }
      );
      setTraceResult(res.data);
      requestAnimationFrame(() =>
        traceRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    } catch (e) { console.error(e); setTraceResult(null); }
  };

  const handleGrammarChange = (txt: string) => {
    setCustomGrammar(txt);
    const lines = txt.trim().split("\n");
    for (const l of lines) {
      if (!l.includes("->")) { if (txt.trim()===""){setError("");} else setError("Each rule must contain '->'"); return;}
      const [lhs, rhs] = l.split("->");
      if (!lhs.trim() || !rhs.trim()) { setError("Missing Left side or Right side."); return; }
      if (rhs.includes("|") && !/\s\|\s/.test(rhs)) { setError("Add spaces around |."); return; }
      if (lhs.includes("|")) { setError("'|' cannot be a Non Terminal."); return; }
    }
    setError("");
  };

  const handleAnalyze = async () => {
    try {
      const res = await axios.post("api/grammar/load",
        grammarToPayload()
      );
      setResult(res.data);
      requestAnimationFrame(() =>
        analyzeRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    } catch { setResult(null); }
  };

  const copyToClipboard = (s:string) => {
    navigator.clipboard.writeText(s);
    setCopiedSymbol(s);
    setTimeout(()=>setCopiedSymbol(null),1200);
  };

  const renderParsingTable = () => {
    if (!result || !result.parse_table) return null;
  
    const hdrs = ["Non-Terminal", ...result.terminals];
  
    return (
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4">Parsing Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-700 dark:border-gray-500">
            <thead className="bg-black text-white">
              <tr>{hdrs.map(h => (
                <th key={h} className="p-2 border-r border-gray-600 last:border-r-0">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {result.non_terminals.map((nt: string) => (
                <tr key={nt} className="border-t border-gray-600">
                  <td className="p-2 border-r border-gray-600 font-semibold">{nt}</td>
                  {result.terminals.map((t: string) => (
                    <td key={t} className="p-2 border-r border-gray-600 font-mono text-xs">
                      {result.parse_table[nt][t]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  const renderNode = ({ nodeDatum }: { nodeDatum: any }) => (
    <g>
      <circle r={8} fill="#fff" />
      <text
        fill="#fff"
        fontSize={30}  
        fontWeight={600}
        x={12}
        dy={5}
      >
        {nodeDatum.name}
      </text>
    </g>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full flex justify-between items-center px-6 py-4 border-b dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="App logo" width={120} height={120} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">LL1 Checker</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
          Powered by
          <Image src="/next.svg" alt="Next.js logo" width={60} height={14} className="dark:invert" />
        </div>
      </header>

      <main className="flex-grow flex flex-col gap-6 p-8 sm:p-16 max-w-5xl mx-auto">


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {examples.map((ex, idx) => (
            <button
              key={idx}
              className={`rounded-lg border px-4 py-2 text-left transition-colors shadow-sm text-sm sm:text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedIndex === idx
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-500"
                  : "bg-white dark:bg-black border-gray-300"
              }`}
              onClick={() => {
                setSelectedIndex(idx);
                setCustomGrammar(ex.grammar);
                setError("");
                setResult(null);
              }}
            >
              {ex.title}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2 flex items-center justify-between">Grammar (edit or write your own):
            <div className="flex gap-2">
              {["->", "|", "ε"].map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => copyToClipboard(symbol)}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {copiedSymbol === symbol ? "Copied!" : symbol}
                </button>
              ))}
            </div>
          </h2>

          <textarea
            className={`w-full min-h-[160px] p-3 border rounded-md bg-gray-50 dark:bg-gray-900 text-sm font-mono resize-none ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
            }`}
            value={customGrammar}
            onChange={(e) => handleGrammarChange(e.target.value)}
            placeholder="E.g. S -> a S b | ε"
          />
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!!error || !customGrammar.trim()}
            className="mt-4 px-6 py-2 bg-black text-white border border-white rounded-md font-medium text-sm transition-transform transition-colors hover:bg-white hover:text-black hover:border-black hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            Analyze
          </button>
        </div>
        <div ref={analyzeRef}>
        {result && result.is_LL1 === true && result.conflicts.length === 0 && (
          <>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">FIRST & FOLLOW Sets</h3>
              <table className="w-full text-sm text-left border border-gray-700 dark:border-gray-500">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="p-2">Non-Terminal</th>
                    <th className="p-2">FIRST</th>
                    <th className="p-2">FOLLOW</th>
                  </tr>
                </thead>
                <tbody>
                  {result.non_terminals.map((nt: any) => (
                    <tr key={nt} className="border-t border-gray-700 dark:border-gray-600">
                      <td className="p-2 font-mono">{nt}</td>
                      <td className="p-2 font-mono">{safeJoin(result.first_sets?.[nt], ", ")}</td>
                      <td className="p-2 font-mono">{safeJoin(result.follow_sets?.[nt], ", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderParsingTable()}
          </>
        )}

        {result && !result.is_LL1 && (
          <div className="mt-8 border border-red-500 p-4 rounded-md bg-red-50 text-red-900">
            <h3 className="text-xl font-bold mb-2">⚠️ La gramática NO es LL(1)</h3>
            {result.conflicts.map((conflict: any, i: any) => (
              <div key={i} className="mb-4">
                <p><strong>Conflicto:</strong> {conflict.type}</p>
                <p><strong>No terminal:</strong> {conflict.non_terminal}</p>
                <p><strong>Intersección:</strong> {safeJoin(conflict.intersection, ", ")}</p>
                <p><strong>Producciones:</strong> {safeJoin(conflict.productions, "  |  ")}</p>
                <p className="italic text-sm mt-1">💡 {conflict.suggestion}</p>
              </div>
            ))}
          </div>
        )}
        </div>

<div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Run LL(1) Parser</h3>

          <label className="block mb-1 font-medium">Input (tokens separated by a space)</label>
          <textarea
            rows={2}
            value={inputString}
            onChange={e=>setInputString(e.target.value)}
            placeholder="id + id"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900 font-mono"
          />

          <label className="block mt-4 mb-1 font-medium">Max number of steps</label>
          <input
            type="number"
            min={1}
            value={maxSteps}
            onChange={e=>setMaxSteps(Math.max(1, Number(e.target.value)))}
            className="w-32 p-2 border rounded"
          />

          <button
            onClick={handleTraceTree}
            disabled={!customGrammar.trim() || !inputString.trim()}
            className="ml-5 mt-4 px-6 py-2 bg-black text-white border border-white rounded-md font-medium text-sm transition-transform transition-colors hover:bg-white hover:text-black hover:border-black hover:scale-105 active:scale-95 disabled:opacity-40">            Trace & Tree
          </button>
        </div>

        {/* ---- TRACE STACK TABLE ---- */}
        <div ref={traceRef}>
        {traceResult && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">Parsing Trace (Stack / Input / Rule)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-700 dark:border-gray-500">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="p-2 border-r border-gray-600">Stack</th>
                    <th className="p-2 border-r border-gray-600">Input</th>
                    <th className="p-2">Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {traceResult.trace.map((t,i)=>(
                    <tr
                    key={i}
                    className={
                      "border-t border-gray-600 " +
                      (t.rule.includes("(explore)")
                          ? "bg-yellow-200 dark:bg-yellow-900"
                          : t.rule.includes("(extract)")
                          ? "bg-blue-200  dark:bg-blue-900"
                          : "")
                    }
                  >
                      <td className="p-2 font-mono border-r border-gray-600">
                        {safeJoin(t.stack)}
                      </td>
                      <td className="p-2 font-mono border-r border-gray-600">
                        {safeJoin(t.input)}
                      </td>
                      <td className="p-2">{t.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {traceResult && (
              <p
                className={`mt-6 text-lg font-semibold ${
                  traceResult.accepted ? "text-green-600" : "text-red-600"
                }`}
              >
                {traceResult.accepted ? "✅ Input ACCEPTED" : "❌ Input REJECTED"}
              </p>
            )}
            {traceResult && traceResult.explore_points?.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold mb-2">Skipped Tokens: (explore) </h4>
              <ul className="text-sm list-disc ml-6">
                {traceResult.explore_points.map((p,i)=>(
                  <li key={i}>
                    Position {p.pos}: <code>{p.token}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {traceResult && traceResult.extract_points?.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold mb-2">Pop Non Terminal: (extract)</h4>
              <ul className="text-sm list-disc ml-6">
                {traceResult.extract_points.map((p,i)=>(
                  <li key={i}>
                    Step {p.step}: <code>{p.non_terminal} -{">"} </code> con token&nbsp;
                    <code>{p.token}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
          
        )}

        {/* ---- PARSE TREE ---- */}
        {traceResult && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">Parse Tree</h3>

            <div style={{ width: '800px', height: '800px' }}>
              <Tree
                data={[toD3(traceResult.tree)]}   
                orientation="vertical"            
                collapsible={false}               
                pathFunc = "straight"          
                renderCustomNodeElement={renderNode} 
                pathClassFunc={() => "custom-link"}
              />
            </div>
          </div>
        )}
        </div>
      </main>
      <Chatbot />
    </div>
    
  );
}