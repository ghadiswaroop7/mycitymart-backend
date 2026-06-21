const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function getTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getTsxFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getTsxFiles(srcDir);

const map = {
  'LightningIcon': 'FlashIcon',
  'ShieldCheckIcon': 'SecurityCheckIcon',
  'Trash2Icon': 'Delete02Icon',
  'Navigation2Icon': 'Navigation02Icon',
  'InformationIcon': 'InformationCircleIcon'
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let hasChanges = false;
  
  for (const [oldName, newName] of Object.entries(map)) {
    if (content.includes(oldName)) {
      content = content.split(oldName).join(newName);
      hasChanges = true;
    }
  }

  // Fix TabNavigator duplicate property
  if (file.endsWith('TabNavigator.tsx')) {
    if (content.includes("tabBarLabel: 'Local Shops',") && content.includes("tabBarLabel: () => null,")) {
      content = content.replace("tabBarLabel: 'Local Shops',", "// tabBarLabel: 'Local Shops',");
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(file, content);
    console.log('Fixed icons in ' + file);
  }
}
