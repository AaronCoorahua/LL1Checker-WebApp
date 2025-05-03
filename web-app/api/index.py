from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- modelos ----------
class Rule(BaseModel):
    lhs: str
    rhs: List[str]

class GrammarInput(BaseModel):
    grammar: List[Rule]
    start_symbol: str            # ← sin input_string aquí

class TraceInput(GrammarInput):
    input_string: str            # tokens separados por espacio
    max_steps: int = 100


# ---------- /first-follow ----------
@app.post("/first-follow")
def first_follow(data: GrammarInput):
    # … (código idéntico al tuyo: cálculo FIRST, FOLLOW, tabla y conflictos)
    #              ↓↓↓  --- nada cambió aquí ---
    grammar_dict = {}
    non_terminals, terminals = set(), set()

    for rule in data.grammar:
        lhs = rule.lhs.strip()
        non_terminals.add(lhs)
        grammar_dict.setdefault(lhs, [])
        for alt in rule.rhs:
            grammar_dict[lhs].append(alt.strip().split())

    for rhs in grammar_dict.values():
        for prod in rhs:
            for sym in prod:
                if sym not in non_terminals and sym != "ε":
                    terminals.add(sym)
    terminals = sorted(terminals) + ["$"]

    first = {nt: set() for nt in non_terminals}

    def f(x):
        if x not in non_terminals:
            return {x}
        if first[x]:
            return first[x]
        for p in grammar_dict[x]:
            for s in p:
                fs = f(s)
                first[x] |= fs - {"ε"}
                if "ε" not in fs:
                    break
            else:
                first[x].add("ε")
        return first[x]

    for nt in non_terminals:
        f(nt)

    follow = {nt: set() for nt in non_terminals}
    follow[data.start_symbol].add("$")
    changed = True
    while changed:
        changed = False
        for lhs, prods in grammar_dict.items():
            for prod in prods:
                for i, B in enumerate(prod):
                    if B in non_terminals:
                        trailer = prod[i + 1 :]
                        trailer_first = set()
                        if trailer:
                            for s in trailer:
                                trailer_first |= f(s) - {"ε"}
                                if "ε" not in f(s):
                                    break
                            else:
                                trailer_first.add("ε")
                        else:
                            trailer_first.add("ε")
                        before = len(follow[B])
                        follow[B] |= trailer_first - {"ε"}
                        if "ε" in trailer_first:
                            follow[B] |= follow[lhs]
                        if len(follow[B]) > before:
                            changed = True

    table = {nt: {t: None for t in terminals} for nt in non_terminals}
    conflicts, is_ll1 = [], True
    for lhs, prods in grammar_dict.items():
        for prod in prods:
            prod_first = set()
            for s in prod:
                prod_first |= f(s)
                if "ε" not in f(s):
                    break
            else:
                prod_first.add("ε")

            for t in prod_first - {"ε"}:
                if table[lhs][t]:
                    conflicts.append(
                        {
                            "non_terminal": lhs,
                            "type": "FIRST/FIRST conflict",
                            "productions": [
                                " ".join(table[lhs][t]),
                                " ".join(prod),
                            ],
                            "intersection": [t],
                            "suggestion": f"Factoriza las producciones comunes de {lhs}",
                        }
                    )
                    is_ll1 = False
                else:
                    table[lhs][t] = prod

            if "ε" in prod_first:
                for t in follow[lhs]:
                    if table[lhs][t]:
                        conflicts.append(
                            {
                                "non_terminal": lhs,
                                "type": "FIRST/FOLLOW conflict",
                                "productions": [
                                    " ".join(table[lhs][t]),
                                    f"{lhs} -> ε",
                                ],
                                "intersection": [t],
                                "suggestion": f"Verifica si ε y FOLLOW se cruzan en {lhs}",
                            }
                        )
                        is_ll1 = False
                    else:
                        table[lhs][t] = ["ε"]


    return {
        "is_LL1": is_ll1,
        "terminals": terminals,
        "non_terminals": sorted(non_terminals),
        "first_sets": {nt: sorted(list(fs)) for nt, fs in first.items()},
        "follow_sets": {nt: sorted(list(fw)) for nt, fw in follow.items()},
        "grammar": [
            {"lhs": lhs, "rhs": [" ".join(p) for p in grammar_dict[lhs]]}
            for lhs in grammar_dict
        ],
        "conflicts": conflicts,
        "parse_table": {
            nt: {
                t: (" ".join(table[nt][t]) if table[nt][t] else "")
                for t in terminals
            }
            for nt in non_terminals
        },

    }


# ---------- /trace-tree ----------
@app.post("/trace-tree")
def trace_tree(data: TraceInput):
    # ——— construir estructuras auxiliares exactamente igual que arriba ———
    grammar_dict, non_terminals, terminals = {}, set(), set()
    for rule in data.grammar:
        lhs = rule.lhs.strip()
        non_terminals.add(lhs)
        grammar_dict.setdefault(lhs, [])
        for alt in rule.rhs:
            grammar_dict[lhs].append(alt.strip().split())

    for rhs in grammar_dict.values():
        for prod in rhs:
            for sym in prod:
                if sym not in non_terminals and sym != "ε":
                    terminals.add(sym)
    terminals = sorted(terminals) + ["$"]

    first = {nt: set() for nt in non_terminals}

    def f(x):
        if x not in non_terminals:
            return {x}
        if first[x]:
            return first[x]
        for p in grammar_dict[x]:
            for s in p:
                fs = f(s)
                first[x] |= fs - {"ε"}
                if "ε" not in fs:
                    break
            else:
                first[x].add("ε")
        return first[x]

    for nt in non_terminals:
        f(nt)

    follow = {nt: set() for nt in non_terminals}
    follow[data.start_symbol].add("$")
    changed = True
    while changed:
        changed = False
        for lhs, prods in grammar_dict.items():
            for prod in prods:
                for i, B in enumerate(prod):
                    if B in non_terminals:
                        trailer = prod[i + 1 :]
                        trailer_first = set()
                        if trailer:
                            for s in trailer:
                                trailer_first |= f(s) - {"ε"}
                                if "ε" not in f(s):
                                    break
                            else:
                                trailer_first.add("ε")
                        else:
                            trailer_first.add("ε")
                        before = len(follow[B])
                        follow[B] |= trailer_first - {"ε"}
                        if "ε" in trailer_first:
                            follow[B] |= follow[lhs]
                        if len(follow[B]) > before:
                            changed = True

    table = {nt: {t: None for t in terminals} for nt in non_terminals}
    for lhs, prods in grammar_dict.items():
        for prod in prods:
            prod_first = set()
            for s in prod:
                fs = f(s)
                prod_first |= fs
                if "ε" not in fs:
                    break
            else:
                prod_first.add("ε")

            for t in prod_first - {"ε"}:
                table[lhs][t] = prod
            if "ε" in prod_first:
                for t in follow[lhs]:
                    table[lhs][t] = ["ε"]

    # ——— ejecución del parser LL(1) ———
    trace = []
    input_tokens = data.input_string.strip().split() + ["$"]
    stack = ["$", data.start_symbol]
    index = 0

    def snap(stk, inp, rule):
        return {"stack": stk[:], "input": inp[:], "rule": rule}

    def node(lbl):
        return {"label": lbl, "children": []}

    root = node(data.start_symbol)
    tree_stack = [root]  # paralelo a ‘stack’, sin el símbolo $

    steps = 0
    while stack and steps < data.max_steps:
        top = stack.pop()

        # ----- el símbolo $ se maneja aparte -----
        if top == "$":
            rule = "accept" if input_tokens[index] == "$" else "error: input not empty"
            trace.append(snap(stack, input_tokens[index:], rule))
            break

        tree_node = tree_stack.pop()
        current = input_tokens[index] if index < len(input_tokens) else "$"

        if top == current:  # match terminal
            trace.append(snap(stack, input_tokens[index:], f"match {top}"))
            index += 1
            #tree_node["children"].append({"label": top})

        elif top in terminals:  # terminal inesperado
            trace.append(snap(stack, input_tokens[index:], f"error: unexpected {top}"))
            break

        elif table[top].get(current):  # expandir producción
            prod = table[top][current]
            trace.append(snap(stack, input_tokens[index:], f"{top} -> {' '.join(prod)}"))

            if prod == ["ε"]:
                tree_node["children"].append({"label": "ε"})
            else:
                # hijos en orden original
                children = [node(s) for s in prod]
                tree_node["children"].extend(children)
                # push símbolos y nodos en orden inverso
                for s in reversed(prod):
                    stack.append(s)
                for child in reversed(children):
                    tree_stack.append(child)
        else:  # celda vacía → error
            trace.append(snap(stack, input_tokens[index:], f"error: no rule for {top} with {current}"))
            break

        steps += 1

    return {"trace": trace, "tree": root}
