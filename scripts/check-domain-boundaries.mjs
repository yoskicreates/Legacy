/** L3-022 static boundary guard. Pure TypeScript AST, no heuristic text grep. */
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, dirname, sep, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = value => value.split(sep).join('/');
const allowedFileExtensions = /\.(?:ts|tsx|mts|cts)$/i;

function inSubtree(file, subtree) {
  const rel = relative(subtree, file);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function identifyModule(filePath, domainRoot, modules) {
  for (const name of modules) {
    if (inSubtree(filePath, join(domainRoot, name))) return name;
  }
  return null;
}

/** Return a stable rejection reason or null for a legal static import. */
export function validateSpecifier({ specifier, importer, policy, root }) {
  const domainRoot = resolve(root, policy.domainRoot);
  const origin = identifyModule(resolve(importer), domainRoot, policy.modules);
  if (!origin) return 'importing file is outside a declared domain';
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(importer), specifier);
    if (!inSubtree(target, join(domainRoot, origin))) {
      return 'relative path crosses its domain boundary';
    }
    return null;
  }
  if (specifier.startsWith('@domain/')) {
    const parts = specifier.slice('@domain/'.length).split('/');
    const target = parts[0];
    if (!target || !policy.modules.includes(target)) return 'unknown domain alias';
    if (parts.slice(1).some(part => part === '..' || part === '.')) return 'domain alias attempts traversal';
    if (!(policy.allowedDomainImports[origin] ?? []).includes(target)) return `forbidden dependency ${origin} -> ${target}`;
    return null;
  }
  return 'non-domain dependency denied';
}

/** All imports and re-exports must be static; report file/line of every violation. */
export function analyzeDomainSource({ text, file, policy, root }) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const errors = [];
  for (const diagnostic of ast.parseDiagnostics) {
    const line = ast.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
    errors.push({ file: toPosix(relative(root, file)), line, reason: 'TypeScript parse error' });
  }
  const describe = (node, reason) => {
    const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
    errors.push({ file: toPosix(relative(root, file)), line: line + 1, reason });
  };
  const check = (node, spec) => {
    if (!ts.isStringLiteralLike(spec)) return describe(node, 'nonliteral import not auditable');
    const reason = validateSpecifier({ specifier: spec.text, importer: file, policy, root });
    if (reason) describe(node, reason);
  };
  const walk = node => {
    if (ts.isImportDeclaration(node)) check(node, node.moduleSpecifier);
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) check(node, node.moduleSpecifier);
    else if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      if (ts.isLiteralTypeNode(argument)) check(node, argument.literal);
      else describe(node, 'nonliteral import type not auditable');
    } else if (ts.isImportEqualsDeclaration(node)) {
      describe(node, 'import-equals is denied');
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) describe(node, 'dynamic import() is denied');
      if (ts.isIdentifier(node.expression) && node.expression.text === 'require') describe(node, 'require() is denied');
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  return errors;
}

async function enumerateDomainFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await enumerateDomainFiles(file));
    else if (entry.isFile() && allowedFileExtensions.test(entry.name)) result.push(file);
  }
  return result.sort();
}

/** Report missing declared folders as failures, not as empty successful checks. */
export async function verifyDomainBoundaries(root = defaultRoot) {
  const policy = JSON.parse(await readFile(join(root, 'docs/domain-dependencies.json'), 'utf8'));
  const domainRoot = resolve(root, policy.domainRoot);
  const errors = [];
  const keys = Object.keys(policy.allowedDomainImports);
  if (policy.task !== 'L3-022' || policy.modules.length !== 6 || keys.length !== 6 || new Set(policy.modules).size !== 6) {
    errors.push({ file: 'docs/domain-dependencies.json', line: 1, reason: 'invalid domain policy structure' });
  }
  const rootEntries = await readdir(domainRoot, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isDirectory() || !policy.modules.includes(entry.name)) {
      errors.push({ file: toPosix(relative(root, join(domainRoot, entry.name))), line: 1, reason: 'undeclared domain entry' });
    }
  }
  let scanned = 0;
  for (const name of policy.modules) {
    const dir = join(root, policy.domainRoot, name);
    let files = [];
    try { files = await enumerateDomainFiles(dir); }
    catch { errors.push({ file: toPosix(relative(root, dir)), line: 1, reason: 'missing declared domain directory' }); continue; }
    if (files.length === 0) errors.push({ file: toPosix(relative(root, dir)), line: 1, reason: 'empty declared domain module' });
    for (const file of files) {
      scanned++;
      errors.push(...analyzeDomainSource({ text: await readFile(file, 'utf8'), file, policy, root }));
    }
  }
  return { scanned, errors, policy };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyDomainBoundaries();
  for (const issue of result.errors) console.error(`FAIL ${issue.file}:${issue.line}: ${issue.reason}`);
  if (result.errors.length > 0) process.exitCode = 1;
  else console.log(`PASS domain dependency rules: ${result.scanned} TypeScript files in ${result.policy.modules.length} independent modules`);
}
