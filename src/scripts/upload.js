const fs = require('fs');
const path = require('path');

async function uploadFile() {
  try {
    const defaultPath = path.join(process.cwd(), 'assets', 'Curious Freaks Coding Sheet.xlsx');
    const filePath = process.env.FILE_PATH || defaultPath;
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at: ${filePath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('file', blob, 'dsa-questions.xlsx');

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminSecret = process.env.ADMIN_SECRET || '';

    console.log(`Uploading to ${appUrl}/api/admin/import-dsa...`);
    const res = await fetch(`${appUrl}/api/admin/import-dsa`, {
      method: 'POST',
      headers: {
        ...(adminSecret ? { 'x-admin-token': adminSecret } : {}),
      },
      body: formData,
    });

    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

uploadFile();
