"use client"

import { useState } from "react";
import Image from "next/image";

export default function GrammarSelector() {
  const examples = [
    {
      title: "Balanced 0's and 1's",
      grammar: `S -> 0 S 1 | ε`
    },
    {
      title: "Even-Length Palindromes",
      grammar: `S -> a S a | b S b | ε`
    },
    {
      title: "AnBn",
      grammar: `S -> a S b | ε`
    },
    {
      title: "Simple Assignment",
      grammar: `S -> id = num ;`
    },
    {
      title: "Arithmetic Expressions",
      grammar: `E -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id`
    },
    {
      title: "Block of Statements",
      grammar: `Block -> { Stmts }\nStmts -> Stmt Stmts | ε\nStmt -> id = num ;`
    },
    {
      title: "Simple HTML",
      grammar: `HTML -> <tag> text </tag> | text`
    },
    {
      title: "Simple Loop",
      grammar: `Loop -> while ( Cond ) Stmt`
    },
    {
      title: "If-Else",
      grammar: `S -> if ( C ) S else S | assign`
    },
    {
      title: "Repeated AB Pattern",
      grammar: `S -> A S'\nS' -> B S' | ε\nA -> a\nB -> b`
    }
  ];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customGrammar, setCustomGrammar] = useState("");
  const [error, setError] = useState("");

  const handleGrammarChange = (value: string) => {
    setCustomGrammar(value);

    const lines = value.trim().split("\n");
    for (let line of lines) {
      if (!line.includes("->")) {
        setError("Each rule must contain '->'");
        return;
      }
      const [lhs, rhs] = line.split("->");
      if (!lhs.trim() || !rhs.trim()) {
        setError("Missing LHS or RHS in a production");
        return;
      }
      if (rhs.includes("|") && !/\s\|\s/.test(rhs)) {
        setError("Use spaces around '|' for clarity (e.g., A -> x | y)");
        return;
      }
    }
    setError("");
  };

  const handleAnalyze = () => {
    const grammarLines = customGrammar.trim().split("\n");
    const json = {
      grammar: grammarLines.map((line) => {
        const [lhs, rhs] = line.split("->").map(part => part.trim());
        return {
          lhs,
          rhs: rhs.split(" | ").map(prod => prod.trim())
        };
      }),
      start_symbol: grammarLines[0]?.split("->")[0].trim() || ""
    };
    console.log(JSON.stringify(json, null, 2));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 border-b dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="App logo" width={120} height={120} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">LL1 Checker</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
          Powered by Next.js
          <Image src="/next.svg" alt="Next.js logo" width={60} height={14} className="dark:invert" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col gap-6 p-8 sm:p-16 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold text-center">Select an Example Grammar LL(1)</h1>

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
              }}
            >
              {ex.title}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Grammar (edit or write your own):</h2>
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
            className={`mt-4 px-6 py-2 bg-black text-white border border-white rounded-md font-medium text-sm transition-colors hover:bg-white hover:text-black hover:border-black disabled:opacity-40`}
          >
            Analizar
          </button>
        </div>
      </main>
    </div>
  );
}
