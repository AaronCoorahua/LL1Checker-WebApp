export const validLL1Output = {
  is_LL1: true,
  terminals: ["a", "b", "$"],
  non_terminals: ["S", "S'", "A", "B"],
  first_sets: {
    "S": ["a"],
    "S'": ["b", "ε"],
    "A": ["a"],
    "B": ["b"]
  },
  follow_sets: {
    "S": ["$"],
    "S'": ["$"],
    "A": ["a"],
    "B": ["$"]
  },
  grammar: [
    { lhs: "S", rhs: ["A S'"] },
    { lhs: "S'", rhs: ["B S'", "ε"] },
    { lhs: "A", rhs: ["a"] },
    { lhs: "B", rhs: ["b"] }
  ],
  conflicts: []
};

export const invalidLL1Output = {
  is_LL1: false,
  terminals: ["a", "b", "$"],
  non_terminals: ["X"],
  first_sets: {
    "X": ["a"]
  },
  follow_sets: {
    "X": ["$"]
  },
  conflicts: [
    {
      non_terminal: "X",
      type: "FIRST/FIRST conflict",
      productions: ["X -> a B", "X -> a C"],
      intersection: ["a"],
      suggestion: "Factoriza las producciones comunes: X -> a X'"
    }
  ]
};
