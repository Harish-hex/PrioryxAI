const fs = require('fs');
const path = require('path');

async function testUpload() {
  const fileBuffer = fs.readFileSync(path.join(__dirname, 'public/logo.png'));
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('file', blob, 'logo.png');

  try {
    console.log('Sending request...');
    const res = await fetch('http://localhost:3000/api/schedule/timetable', {
      method: 'POST',
      body: formData
    });

    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testUpload();
