const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Function to get all TSX files
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

// Mapping exactly as requested
const exactMappings = {
  // Tabs
  'Home': 'Home02Icon',
  'LayoutGrid': 'DashboardSquare02Icon',
  'Heart': 'FavouriteIcon',
  'ShoppingBag': 'ShoppingCart01Icon',
  'User': 'UserIcon',

  // UI
  'ChevronLeft': 'ArrowLeft01Icon',
  'Share2': 'Share01Icon',
  'Star': 'StarIcon',
  'BadgeCheck': 'CheckmarkBadge01Icon',
  'Bell': 'Notification02Icon',
  'MapPin': 'Location01Icon',
  'Zap': 'Lightning01Icon',
  'Camera': 'Camera02Icon',
  'QrCode': 'QrCode02Icon',
  'Truck': 'Truck01Icon',
  'Search': 'Search02Icon',

  // Categories fallback (they might be mapped via CategoriesScreen.tsx object instead)
  'Dumbbell': 'Dumbbell02Icon',
  'Sparkles': 'Dress02Icon',
  'Shirt': 'TShirtIcon',
  'Baby': 'BabyBed01Icon',
  'Palette': 'PaintBrush02Icon',
  'Gem': 'Diamond01Icon',
  'Smartphone': 'SmartPhone01Icon',
  'Watch': 'SmartWatch01Icon',
  'Car': 'Car01Icon',
  'Paperclip': 'PaperclipIcon',
  'BookOpen': 'BookOpen01Icon',
  'Cat': 'CatIcon',
  'Music': 'MusicNote01Icon'
};

const processed = new Set();

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let hasChanges = false;

  // 1. Check if lucide-react-native is imported
  const lucideImportMatch = content.match(/import\s+(?:{\s*([^}]+)\s*}|\*\s+as\s+(\w+))\s+from\s+['"]lucide-react-native['"];?/);
  
  if (lucideImportMatch) {
    let importedIcons = [];
    if (lucideImportMatch[1]) {
      // Named imports
      importedIcons = lucideImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    // Determine relative path to HugeIcon wrapper
    const relPath = path.relative(path.dirname(file), path.join(__dirname, '../src/components/HugeIcon')).replace(/\\/g, '/');
    let importWrapper = `import { HugeIcon } from '${relPath.startsWith('.') ? relPath : './' + relPath}';\n`;

    let hugeIconsToImport = new Set();
    
    if (lucideImportMatch[1]) {
      // Named imports: Replace JSX tags `<IconName ` with `<HugeIcon icon={MappedName} `
      for (const oldIcon of importedIcons) {
        const mappedIcon = exactMappings[oldIcon] || oldIcon + 'Icon'; // Fallback mapping e.g., Clock -> ClockIcon
        hugeIconsToImport.add(mappedIcon);
        
        // Regex to replace `<OldIcon ...` or `<OldIcon>`
        const regex = new RegExp(`<${oldIcon}(\\s+|\\/|>)`, 'g');
        content = content.replace(regex, `<HugeIcon icon={${mappedIcon}}$1`);
      }
      
      // Remove old import and add new imports
      content = content.replace(lucideImportMatch[0], `${importWrapper}import { ${Array.from(hugeIconsToImport).join(', ')} } from '@hugeicons/core-free-icons';`);
      hasChanges = true;
    } else if (lucideImportMatch[2]) {
      // Namespace import like `import * as Icons from 'lucide-react-native'`
      const namespace = lucideImportMatch[2];
      
      // We will parse all `<Icons.IconName ...` usages
      const tagRegex = new RegExp(`<${namespace}\\.(\\w+)([\\s\\/>])`, 'g');
      
      content = content.replace(tagRegex, (match, iconName, endChar) => {
        const mappedIcon = exactMappings[iconName] || iconName + 'Icon';
        hugeIconsToImport.add(mappedIcon);
        return `<HugeIcon icon={${mappedIcon}}${endChar}`;
      });

      // Special handling for CategoriesScreen `Icons[name]` mapping
      content = content.replace(/const CatIcon = \(Icons as any\)\[cat\.iconName\];/g, "const mappedName = cat.iconName; // handled inline");
      content = content.replace(/<CatIcon size={24} color={cat.iconColor} \/>/g, "<HugeIcon icon={(Hugeicons as any)[cat.iconName]} size={24} color={cat.iconColor} />");
      content = content.replace(/<CatIcon size=\{40\} color=\{cat\.iconColor\} \/>/g, "<HugeIcon icon={(Hugeicons as any)[cat.iconName]} size={40} color={cat.iconColor} />");
      
      // Remove old import
      content = content.replace(lucideImportMatch[0], `${importWrapper}import * as Hugeicons from '@hugeicons/core-free-icons';`);

      // Overwrite specific iconNames in Categories_DATA to match the explicit STEP 3 requests
      content = content.replace(/iconName:\s*"Star"/g, 'iconName: "StarIcon"'); 
      content = content.replace(/iconName:\s*"Sparkles"/g, 'iconName: "Dress02Icon"'); 
      content = content.replace(/iconName:\s*"Shirt"/g, 'iconName: "TShirtIcon"'); 
      content = content.replace(/iconName:\s*"Heart"/g, 'iconName: "FavouriteIcon"'); 
      content = content.replace(/iconName:\s*"User"/g, 'iconName: "UserIcon"'); 
      content = content.replace(/iconName:\s*"Baby"/g, 'iconName: "BabyBed01Icon"'); 
      content = content.replace(/iconName:\s*"Home"/g, 'iconName: "Sofa01Icon"'); // Home -> Furniture
      content = content.replace(/iconName:\s*"Palette"/g, 'iconName: "PaintBrush02Icon"'); 
      content = content.replace(/iconName:\s*"Gem"/g, 'iconName: "Diamond01Icon"'); 
      content = content.replace(/iconName:\s*"ShoppingBag"/g, 'iconName: "ShoppingCart01Icon"'); 
      content = content.replace(/iconName:\s*"Smartphone"/g, 'iconName: "Camera02Icon"'); 
      content = content.replace(/iconName:\s*"Watch"/g, 'iconName: "SmartWatch01Icon"'); 
      content = content.replace(/iconName:\s*"Dumbbell"/g, 'iconName: "Dumbbell02Icon"'); 
      content = content.replace(/iconName:\s*"Car"/g, 'iconName: "Car01Icon"'); 
      content = content.replace(/iconName:\s*"Paperclip"/g, 'iconName: "Store02Icon"'); // Used as local shops
      content = content.replace(/iconName:\s*"ShoppingCart"/g, 'iconName: "ShoppingBasket01Icon"'); 
      content = content.replace(/iconName:\s*"BookOpen"/g, 'iconName: "BookOpen01Icon"'); 
      content = content.replace(/iconName:\s*"Cat"/g, 'iconName: "CatIcon"'); 
      content = content.replace(/iconName:\s*"Music"/g, 'iconName: "MusicNote01Icon"'); 

      hasChanges = true;
    }
  }

  // 2. Replace Emojis
  if (content.includes('📍')) {
    const relPath = path.relative(path.dirname(file), path.join(__dirname, '../src/components/HugeIcon')).replace(/\\/g, '/');
    if (!content.includes('import { HugeIcon }')) {
      content = `import { HugeIcon } from '${relPath.startsWith('.') ? relPath : './' + relPath}';\nimport { Location01Icon } from '@hugeicons/core-free-icons';\n` + content;
    } else if (!content.includes('Location01Icon')) {
      content = content.replace(/import \{([^}]+)\} from '@hugeicons\/core-free-icons';/, "import { $1, Location01Icon } from '@hugeicons/core-free-icons';");
    }
    content = content.replace(/📍/g, '<HugeIcon icon={Location01Icon} size={16} />');
    hasChanges = true;
  }
  
  if (content.includes('🚚')) {
    const relPath = path.relative(path.dirname(file), path.join(__dirname, '../src/components/HugeIcon')).replace(/\\/g, '/');
    if (!content.includes('import { HugeIcon }')) {
      content = `import { HugeIcon } from '${relPath.startsWith('.') ? relPath : './' + relPath}';\nimport { Truck01Icon } from '@hugeicons/core-free-icons';\n` + content;
    } else if (!content.includes('Truck01Icon')) {
      content = content.replace(/import \{([^}]+)\} from '@hugeicons\/core-free-icons';/, "import { $1, Truck01Icon } from '@hugeicons/core-free-icons';");
    }
    content = content.replace(/🚚/g, '<HugeIcon icon={Truck01Icon} size={16} />');
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

console.log('Mass replacement complete.');
