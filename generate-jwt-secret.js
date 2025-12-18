#!/usr/bin/env node
/**
 * JWT Secret Generator for Railway Deployment
 *
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('\n=== JWT Secret Generator ===\n');
console.log('Generating secure random secret...\n');

const secret = crypto.randomBytes(64).toString('hex');

console.log('Your JWT Secret:');
console.log('================');
console.log(secret);
console.log('================\n');

console.log('⚠️  IMPORTANT:');
console.log('1. Copy this secret to Railway Dashboard → Variables → JWT_SECRET');
console.log('2. Never commit this secret to your repository');
console.log('3. Keep this secret secure and private\n');
