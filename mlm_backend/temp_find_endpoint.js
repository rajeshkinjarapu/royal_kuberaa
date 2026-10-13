const fs = require('fs');
const content = fs.readFileSync('d:\\My Apps\\Royal Kuberaa\\mlm_backend\\server.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('app.post') && (lines[i].includes('fund') || lines[i].includes('deposit'))) {
        console.log(`Line ${i + 1}: ${lines[i]}`);
    }
}
