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
  'MinusIcon': 'MinusSignIcon',
  'PlusIcon': 'Add01Icon',
  'XIcon': 'Cancel01Icon',
  'Lightning01Icon': 'LightningIcon',
  'QrCode02Icon': 'QrCodeIcon',
  'Truck01Icon': 'TruckIcon',
  'CheckCircle2Icon': 'Tick01Icon',
  'RotateCcwIcon': 'ReloadIcon',
  'MessageSquareIcon': 'Message02Icon',
  'MessageCircleIcon': 'Message01Icon',
  'CheckCircleIcon': 'Tick01Icon',
  'InfoIcon': 'InformationIcon',
  'LogOutIcon': 'Logout02Icon',
  'RefreshCwIcon': 'ReloadIcon',
  'PhoneIcon': 'CallIcon'
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

  if (hasChanges) {
    fs.writeFileSync(file, content);
    console.log('Fixed icons in ' + file);
  }
}
