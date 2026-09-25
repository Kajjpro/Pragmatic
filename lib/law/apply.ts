import type { Change, ChangeType, ClauseResult, RawClause } from "./types";

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const cleanNumber = (n: string) => n.trim().replace(/\.+$/, "");

export function compareNumbers(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

type State = {
  number: string;
  oldText: string | null;
  newText: string | null;
  touched: boolean;
  applyError: boolean;
  quotes: string[];
};

export function applyChanges(
  oldClauses: RawClause[],
  changes: Change[],
): ClauseResult[] {
  const states: State[] = oldClauses.map((c) => ({
    number: c.number,
    oldText: c.text,
    newText: c.text,
    touched: false,
    applyError: false,
    quotes: [],
  }));

  const find = (n: string) => states.find((s) => s.number === n);

  const insert = (s: State) => {
    const at = states.findIndex((x) => compareNumbers(x.number, s.number) > 0);
    if (at === -1) states.push(s);
    else states.splice(at, 0, s);
  };

  const fresh = (number: string, newText: string | null, applyError: boolean): State => ({
    number,
    oldText: null,
    newText,
    touched: true,
    applyError,
    quotes: [],
  });

  for (const change of changes) {
    const number = cleanNumber(change.number);
    const target = find(number);
    let state: State;

    switch (change.type) {
      case "ADD": {
        state = fresh(number, squash(change.newText), target !== undefined);
        insert(state);
        break;
      }

      case "REMOVE": {
        if (!target) {
          state = fresh(number, null, true);
          insert(state);
        } else {
          state = target;
          if (state.newText === null) state.applyError = true;
          state.newText = null;
        }
        break;
      }

      case "REWRITE": {
        if (!target) {
          state = fresh(number, squash(change.newText), true);
          insert(state);
        } else {
          state = target;
          if (state.newText === null) state.applyError = true;
          state.newText = squash(change.newText);
        }
        break;
      }

      case "REPLACE_WORDS": {
        if (!target) {
          state = fresh(number, null, true);
          insert(state);
          break;
        }
        state = target;
        const words = squash(change.oldWords);
        const before = state.newText;
        if (before === null || words === "") {
          state.applyError = true;
          break;
        }
        const first = before.indexOf(words);
        if (first === -1) {
          state.applyError = true;
          break;
        }
        if (before.indexOf(words, first + 1) !== -1) state.applyError = true;
        const after = squash(
          before.slice(0, first) + change.newText + before.slice(first + words.length),
        );
        if (after === before) state.applyError = true;
        state.newText = after;
        break;
      }
    }

    state.touched = true;
    const quote = change.sourceQuote?.trim();
    if (quote && !state.quotes.includes(quote)) state.quotes.push(quote);
  }

  return states.map((s): ClauseResult => {
    let changeType: ChangeType;
    if (s.oldText === null && s.newText !== null) changeType = "ADDED";
    else if (s.newText === null && s.oldText !== null) changeType = "REMOVED";
    else if (s.oldText !== s.newText || s.touched) changeType = "CHANGED";
    else changeType = "UNCHANGED";

    return {
      number: s.number,
      oldText: s.oldText,
      newText: s.newText,
      changeType,
      sourceQuote: s.quotes.length ? s.quotes.join("\n") : null,
      applyError: s.applyError,
    };
  });
}
