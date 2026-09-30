/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for transpiled server authentication code. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadAuth(env) {
  const source = fs.readFileSync('lib/admin-auth.ts', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require, Buffer, process: { env } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test('admin authentication fails closed without both environment values', () => {
  for (const env of [{}, { CASE_ADMIN_PASSWORD: 'test-only' }, { CASE_ADMIN_SECRET: 'test-only' }]) {
    const auth = loadAuth(env);
    assert.equal(auth.getAdminPassword(), null);
    assert.equal(auth.isValidSession('forged-session'), false);
    assert.throws(() => auth.getSessionToken(), /not configured/);
  }
});

test('configured authentication accepts its token and rejects modified tokens', () => {
  const auth = loadAuth({ CASE_ADMIN_PASSWORD: 'test-only', CASE_ADMIN_SECRET: 'test-secret-not-for-deployment' });
  const token = auth.getSessionToken();
  assert.equal(auth.isValidSession(token), true);
  assert.equal(auth.isValidSession(token.slice(1)), false);
  assert.equal(auth.isValidSession('0'.repeat(token.length)), false);
  assert.equal(auth.isValidSession(), false);
});
