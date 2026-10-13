/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'CELL_REF'
  | 'RANGE'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'COMMA'
  | 'COLON'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export function tokenizeFormula(input: string): Token[] {
  let text = input.trim();
  if (text.startsWith('=')) {
    text = text.substring(1).trim();
  }

  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // String literals "text"
    if (char === '"') {
      let str = '';
      i++; // skip opening quote
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < text.length) {
          str += text[i + 1];
          i += 2;
        } else {
          str += text[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str, position: i });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < text.length && /[0-9]/.test(text[i + 1]))) {
      let numStr = '';
      while (i < text.length && /[0-9.]/.test(text[i])) {
        numStr += text[i];
        i++;
      }
      // Check for scientific notation (e.g. 1.2e5)
      if (i < text.length && (text[i] === 'e' || text[i] === 'E')) {
        numStr += text[i];
        i++;
        if (i < text.length && (text[i] === '+' || text[i] === '-')) {
          numStr += text[i];
          i++;
        }
        while (i < text.length && /[0-9]/.test(text[i])) {
          numStr += text[i];
          i++;
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr, position: i });
      continue;
    }

    // Punctuation
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: i });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: i });
      i++;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',', position: i });
      i++;
      continue;
    }
    if (char === ':') {
      tokens.push({ type: 'COLON', value: ':', position: i });
      i++;
      continue;
    }

    // Comparison Operators (<=, >=, <>, =, <, >)
    if (char === '<' || char === '>') {
      let op = char;
      i++;
      if (i < text.length && (text[i] === '=' || (char === '<' && text[i] === '>'))) {
        op += text[i];
        i++;
      }
      tokens.push({ type: 'OPERATOR', value: op, position: i });
      continue;
    }

    if (char === '=') {
      tokens.push({ type: 'OPERATOR', value: '=', position: i });
      i++;
      continue;
    }

    // Arithmetic / String Operators (+, -, *, /, ^, %, &)
    if (['+', '-', '*', '/', '^', '%', '&'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, position: i });
      i++;
      continue;
    }

    // Identifiers: Function name, Boolean, or Cell Reference / Range (e.g. SUM, TRUE, A1, Sheet1!A1:B10)
    if (/[a-zA-Z_'\$]/.test(char)) {
      let ident = '';
      while (i < text.length && /[a-zA-Z0-9_'\$!:]/.test(text[i])) {
        ident += text[i];
        i++;
      }

      const upper = ident.toUpperCase();

      // Check if it's boolean
      if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'BOOLEAN', value: upper, position: i });
        continue;
      }

      // Check if followed by '(' -> Function
      if (i < text.length && text[i] === '(') {
        tokens.push({ type: 'FUNCTION', value: upper, position: i });
        continue;
      }

      // Check if it's a range (contains ':')
      if (ident.includes(':')) {
        tokens.push({ type: 'RANGE', value: ident, position: i });
        continue;
      }

      // Check if it matches cell reference pattern: [Sheet!]?($)?[A-Z]+($)?[0-9]+
      const cellRefRegex = /^('?[^'!]+'?!|)(\$?)[A-Za-z]+(\$?)[0-9]+$/;
      if (cellRefRegex.test(ident)) {
        tokens.push({ type: 'CELL_REF', value: ident, position: i });
        continue;
      }

      // Otherwise treat as general identifier or cell ref
      tokens.push({ type: 'CELL_REF', value: ident, position: i });
      continue;
    }

    // Unknown character: skip or record as operator
    tokens.push({ type: 'OPERATOR', value: char, position: i });
    i++;
  }

  tokens.push({ type: 'EOF', value: '', position: text.length });
  return tokens;
}
