const fs = require('fs');
const icons = require('@hugeicons/core-free-icons');

const iconNames = Object.keys(icons);
fs.writeFileSync('scratch/hugeicons_exports.json', JSON.stringify(iconNames, null, 2));
console.log('Exported ' + iconNames.length + ' icons.');
