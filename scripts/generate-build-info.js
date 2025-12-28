#!/usr/bin/env node

/**
 * Script untuk generate build.json dengan timestamp
 * File ini digunakan untuk auto-reload mechanism
 */

const fs = require('fs')
const path = require('path')

const buildInfo = {
  version: Date.now().toString(),
  buildTime: new Date().toISOString(),
  gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'development',
  environment: process.env.NODE_ENV || 'development',
}

const outputPath = path.join(__dirname, '..', 'public', 'build.json')

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2))

console.log('✓ Build info generated:', buildInfo.buildTime)
