const fs = require('fs');
const content = fs.readFileSync('d:\\My Apps\\Royal Kuberaa\\mlm_backend\\server.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('app.post(') || lines[i].includes('app.get(')) {
        if (lines[i].includes('/api/')) {
            console.log(lines[i].trim());
        }
    }
}
