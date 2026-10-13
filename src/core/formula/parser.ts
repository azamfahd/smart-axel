/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token, tokenizeFormula } from './tokenizer.ts';

export type ASTNode =
  | { type: 'NUMBER'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'BOOLEAN'; value: boolean }
  | { type: 'CELL_REF'; ref: string }
  | { type: 'RANGE'; range: string }
  | { type: 'FUNCTION'; name: string; args: ASTNode[] }
  | { type: 'BINARY_OP'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'UNARY_OP'; operator: string; operand: ASTNode };

export class FormulaParser {
  private tokens: Token[] = [];
  private current: number = 0;

  parse(formulaStr: string): ASTNode {
    this.tokens = tokenizeFormula(formulaStr);
    this.current = 0;
    const node = this.parseExpression();
    return node;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', position: -1 };
  }

  private match(...expectedValues: string[]): boolean {
    const token = this.peek();
    if (expectedValues.includes(token.value)) {
      this.current++;
      return true;
    }
    return false;
  }

  private consume(expectedType: string, msg: string): Token {
    const token = this.peek();
    if (token.type !== expectedType && token.value !== expectedType) {
      throw new Error(`Parse error: ${msg}. Got ${token.type}(${token.value})`);
    }
    this.current++;
    return token;
  }

  // Precedence hierarchy
  // 1. Comparison: =, <>, <, <=, >, >=
  // 2. Concatenation: &
  // 3. Additive: +, -
  // 4. Multiplicative: *, /
  // 5. Exponentiation: ^
  // 6. Percent: %
  // 7. Unary: +, -
  // 8. Primary

  private parseExpression(): ASTNode {
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    let left = this.parseConcat();
    while (['=', '<>', '<', '<=', '>', '>='].includes(this.peek().value)) {
      const op = this.peek().value;
      this.current++;
      const right = this.parseConcat();
      left = { type: 'BINARY_OP', operator: op, left, right };
    }
    return left;
  }

  private parseConcat(): ASTNode {
    let left = this.parseAdditive();
    while (this.peek().value === '&') {
      this.current++;
      const right = this.parseAdditive();
      left = { type: 'BINARY_OP', operator: '&', left, right };
    }
    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (['+', '-'].includes(this.peek().value)) {
      const op = this.peek().value;
      this.current++;
      const right = this.parseMultiplicative();
      left = { type: 'BINARY_OP', operator: op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseExponent();
    while (['*', '/'].includes(this.peek().value)) {
      const op = this.peek().value;
      this.current++;
      const right = this.parseExponent();
      left = { type: 'BINARY_OP', operator: op, left, right };
    }
    return left;
  }

  private parseExponent(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().value === '^') {
      this.current++;
      const right = this.parseUnary();
      left = { type: 'BINARY_OP', operator: '^', left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (['+', '-'].includes(this.peek().value)) {
      const op = this.peek().value;
      this.current++;
      const operand = this.parseUnary();
      return { type: 'UNARY_OP', operator: op, operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    // Number
    if (token.type === 'NUMBER') {
      this.current++;
      let node: ASTNode = { type: 'NUMBER', value: parseFloat(token.value) };
      // Check for trailing %
      if (this.peek().value === '%') {
        this.current++;
        node = { type: 'NUMBER', value: (node as any).value / 100 };
      }
      return node;
    }

    // String
    if (token.type === 'STRING') {
      this.current++;
      return { type: 'STRING', value: token.value };
    }

    // Boolean
    if (token.type === 'BOOLEAN') {
      this.current++;
      return { type: 'BOOLEAN', value: token.value === 'TRUE' };
    }

    // Parentheses (Expression)
    if (token.type === 'LPAREN' || token.value === '(') {
      this.current++;
      const expr = this.parseExpression();
      this.consume(')', 'Expected closing parenthesis');
      return expr;
    }

    // Function Call: NAME(arg1, arg2, ...)
    if (token.type === 'FUNCTION') {
      const name = token.value.toUpperCase();
      this.current++;
      this.consume('(', `Expected '(' after function ${name}`);

      const args: ASTNode[] = [];
      if (this.peek().value !== ')') {
        args.push(this.parseExpression());
        while (this.peek().value === ',') {
          this.current++;
          args.push(this.parseExpression());
        }
      }
      this.consume(')', `Expected ')' after function arguments for ${name}`);
      return { type: 'FUNCTION', name, args };
    }

    // Range Reference directly tokenized: e.g. A1:B10
    if (token.type === 'RANGE') {
      this.current++;
      return { type: 'RANGE', range: token.value };
    }

    // Cell Ref or potential range constructed via COLON: e.g. A1 : B10
    if (token.type === 'CELL_REF') {
      const ref = token.value;
      this.current++;
      if (this.peek().type === 'COLON' || this.peek().value === ':') {
        this.current++;
        const nextToken = this.consume('CELL_REF', 'Expected cell reference after colon');
        return { type: 'RANGE', range: `${ref}:${nextToken.value}` };
      }
      return { type: 'CELL_REF', ref };
    }

    throw new Error(`Unexpected token at position ${token.position}: ${token.type}(${token.value})`);
  }
}
