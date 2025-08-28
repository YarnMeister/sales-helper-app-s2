#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readDealIds() {
  const filePath = path.join(__dirname, '../specs/deal-id.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse deal IDs (one per line, remove empty lines)
  const dealIds = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isNaN(parseInt(line)))
    .map(line => parseInt(line));
  
  return dealIds;
}

const dealIds = readDealIds();
console.log('Deal IDs loaded:', dealIds.length);
console.log('First 10 deals:', dealIds.slice(0, 10));
console.log('Last 10 deals:', dealIds.slice(-10));
console.log('Sample deals from middle:', dealIds.slice(100, 110));
