#!/usr/bin/env node

/**
 * TypeScript Debug Script
 * 
 * This script helps debug TypeScript compilation differences between
 * local and Vercel environments by outputting detailed information.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 TypeScript Debug Information');
console.log('================================');

// Environment info
console.log('\n📋 Environment:');
console.log(`Node.js: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Working Directory: ${process.cwd()}`);

// Package versions
console.log('\n📦 Package Versions:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const relevantDeps = [
    'typescript',
    'next',
    '@types/react',
    '@types/node'
  ];
  
  relevantDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    if (version) {
      console.log(`${dep}: ${version}`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

// TypeScript config
console.log('\n⚙️ TypeScript Configuration:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('Compiler Options:');
  Object.entries(tsconfig.compilerOptions || {}).forEach(([key, value]) => {
    console.log(`  ${key}: ${JSON.stringify(value)}`);
  });
} catch (error) {
  console.log('❌ Could not read tsconfig.json');
}

// TypeScript version check
console.log('\n🔧 TypeScript CLI Version:');
try {
  const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
  console.log(tscVersion);
} catch (error) {
  console.log('❌ Could not get TypeScript version');
}

// Strict mode check
console.log('\n🚨 TypeScript Strict Mode Check:');
try {
  console.log('Running: npx tsc --noEmit --strict');
  const result = execSync('npx tsc --noEmit --strict', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✅ No TypeScript errors in strict mode');
} catch (error) {
  console.log('❌ TypeScript errors found:');
  console.log(error.stdout || error.message);
}

console.log('\n🏁 Debug complete');
