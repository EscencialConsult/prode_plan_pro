const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dWptb2hqcm5xZWFkempucHhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTg4MDA3ODk1NSwiZXhwIjoyMDk1NjU0OTU1fQ.BYnY6MLYjUpQKEWsP8afeSJAoUcL8Yvy6jR-oIRPVlI';

console.log('Length:', key.length);
let hex = '';
for (let i = 0; i < key.length; i++) {
  hex += key.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
}
console.log('Hex representation:');
console.log(hex.trim());
