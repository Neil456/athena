#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up GitHub OAuth for Athena...\n");

// Your GitHub OAuth credentials
const GITHUB_CLIENT_ID = "Ov23lilwq5TZ0rvMKAGC";
const GITHUB_CLIENT_SECRET = "2870b3e5f8b307f9aaf346d1c5c70a47c4357b3e";
const ATHENA_HOME_URL = "https://athena-production-9c6e.up.railway.app/";

// Create .env file content
const envContent = `# GitHub OAuth Configuration for Athena
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}

# Athena Production URL
ATHENA_HOME_URL=${ATHENA_HOME_URL}

# Other environment variables can be added here
`;

// Write to .env file
const envPath = path.join(__dirname, "..", ".env");
fs.writeFileSync(envPath, envContent);

console.log("✅ Created .env file with your GitHub OAuth credentials");
console.log(`📁 Location: ${envPath}`);
console.log("\n🔧 Next steps:");
console.log("1. Make sure your GitHub OAuth app is configured with:");
console.log(`   - Homepage URL: ${ATHENA_HOME_URL}`);
console.log(`   - Authorization callback URL: ${ATHENA_HOME_URL}auth/callback`);
console.log("2. Start your Athena application");
console.log(
  '3. Try connecting to GitHub - you should now see "Athena wants access to your GitHub account"',
);
console.log("\n⚠️  Note: The .env file is already in .gitignore for security");
