const fs = require('fs');

async function uploadFile() {
  try {
    const filePath = 'D:\\Project\\Curious Freaks Coding Sheet.xlsx';
    const fileBuffer = fs.readFileSync(filePath);
    
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('file', blob, 'dsa-questions.xlsx');

    console.log('Uploading to http://localhost:3000/api/admin/import-dsa...');
    const res = await fetch('http://localhost:3000/api/admin/import-dsa', {
      method: 'POST',
      body: formData
    });

    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

uploadFile();
