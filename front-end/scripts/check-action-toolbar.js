// Simple enforcement script: ensures ActionToolbar is used in key pages
// Exits with non-zero status if any page is missing the import or usage.

import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src', 'pages');
const pages = [
  'Companies.jsx',
  'Employees.jsx',
  'ManagementUnits.jsx',
  'Users.jsx',
  'Reviews.jsx',
  'CostCenters.jsx',
  'Permissions.jsx',
];

let ok = true;
for (const file of pages) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { console.error(`[toolbar-check] Missing file: ${file}`); ok = false; continue; }
  const txt = fs.readFileSync(full, 'utf8');
  const hasImport = txt.includes("import ActionToolbar from '../components/ActionToolbar';");
  const hasUsage = txt.includes('<ActionToolbar');
  if (!hasImport || !hasUsage) {
    console.error(`[toolbar-check] ${file} must import and use ActionToolbar`);
    ok = false;
  }
  // Require usage of the shared ActionToolbar component; skip deeper style checks
}

if (!ok) {
  console.error('[toolbar-check] ActionToolbar standard not satisfied.');
  process.exit(1);
} else {
  console.log('[toolbar-check] OK: All pages use ActionToolbar.');
}