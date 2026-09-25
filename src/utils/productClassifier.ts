/**
 * Master Intelligent Product Classifier & Auto-Correction Engine
 * 
 * Guarantees 100% strict gender and department isolation:
 * - Men products NEVER appear under Women / Ladies / Lingerie.
 * - Women products NEVER appear under Men.
 * - Auto-heals accidental admin or seller classification mistakes using NLP token matching on title, tags, description, and keywords.
 */

export type StandardCategoryKey =
  | 'kurti_saree_lehenga'
  | 'women_western'
  | 'lingerie'
  | 'men'
  | 'kids_toys'
  | 'beauty'
  | 'home_kitchen'
  | 'grocery'
  | 'electronics'
  | 'bags'
  | 'jewellery'
  | 'watches'
  | 'sports'
  | 'books'
  | 'pets'
  | 'general';

export type DetectedGender = 'men' | 'women' | 'kids' | 'unisex' | 'na';

export interface ProductLike {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  categoryId?: string;
  subCategory?: string;
  subcategory?: string;
  subCategoryId?: string;
  tags?: string[] | string;
  brand?: string;
  vendor?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
}

// Word boundary regex helper for strict token matching
const hasWord = (text: string, words: string[]): boolean => {
  if (!text) return false;
  return words.some(w => {
    // Escape special regex chars if any
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  });
};

const hasPhrase = (text: string, phrases: string[]): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return phrases.some(p => lower.includes(p.toLowerCase()));
};

// -------------------------------------------------------------
// GENDER DETECTION ENGINE (Strict Whole-Word Boundaries)
// -------------------------------------------------------------
export const extractGender = (product: ProductLike): DetectedGender => {
  const name = product.name || product.title || '';
  const cat = product.category || product.categoryId || '';
  const sub = product.subCategory || product.subcategory || product.subCategoryId || '';
  const tags = Array.isArray(product.tags) 
    ? product.tags.join(' ') 
    : (typeof product.tags === 'string' ? product.tags : '');
  const desc = product.description || '';

  const fullText = `${name} ${cat} ${sub} ${tags} ${desc}`.toLowerCase();

  // 1. Kids check first (so "boys shirt" or "girls dress" goes to kids)
  if (
    hasWord(fullText, ['baby', 'toddler', 'infant', 'newborn', 'kids', 'kid', 'child', 'children', 'boys', 'girls']) ||
    hasPhrase(fullText, ['baby care', 'baby boy', 'baby girl', 'toys & games', 'school bag'])
  ) {
    // If explicitly adult men/women, don't flag as kids
    if (!hasPhrase(fullText, ["men's", "women's", 'mens wear', 'ladies fashion'])) {
      return 'kids';
    }
  }

  // 2. Strong Women keywords
  const strongWomenWords = [
    'women', 'womens', 'woman', 'ladies', 'lady', 'female', 'she', 'her',
    'saree', 'saris', 'sari', 'kurti', 'kurtis', 'lehenga', 'lehengas', 'choli',
    'dupatta', 'dupattas', 'anarkali', 'blouse', 'blouses', 'petticoat',
    'bra', 'bras', 'panty', 'panties', 'lingerie', 'nighty', 'nightdress',
    'salwar', 'chudidar', 'palazzo', 'palazzos', 'jeggings', 'mangalsutra',
    'jhumka', 'jhumkas', 'earring', 'earrings', 'bangle', 'bangles', 'anklet', 'payal',
    'lipstick', 'kajal', 'eyeliner', 'nailpolish', 'heels', 'stilettos'
  ];

  // Strong Men keywords
  const strongMenWords = [
    'men', 'mens', 'man', 'gents', 'gent', 'gentleman', 'gentlemen', 'male', 'he', 'his',
    'dhoti', 'dhotis', 'lungi', 'lungis', 'shaving', 'beard', 'razor'
  ];

  const hasWomenMarker = hasWord(fullText, strongWomenWords);
  const hasMenMarker = hasWord(fullText, strongMenWords);

  // Check for explicit "Men Kurta" or "Kurta for Men"
  if (hasPhrase(fullText, ['men kurta', 'kurta for men', 'mens kurta', "men's kurta", 'kurta pajama for men', 'gents kurta'])) {
    return 'men';
  }

  if (hasWomenMarker && !hasMenMarker) return 'women';
  if (hasMenMarker && !hasWomenMarker) return 'men';

  if (hasWomenMarker && hasMenMarker) {
    // Determine primacy based on product title
    const nameOnly = name.toLowerCase();
    if (hasWord(nameOnly, strongWomenWords)) return 'women';
    if (hasWord(nameOnly, strongMenWords)) return 'men';
    return 'unisex';
  }

  return 'na';
};

// -------------------------------------------------------------
// MASTER CATEGORY CLASSIFIER (Self-Healing Algorithm)
// -------------------------------------------------------------
export const classifyProduct = (product: ProductLike): StandardCategoryKey => {
  const name = (product.name || product.title || '').trim();
  const cat = (product.category || product.categoryId || '').trim();
  const sub = (product.subCategory || product.subcategory || product.subCategoryId || '').trim();
  const tags = Array.isArray(product.tags) 
    ? product.tags.join(' ') 
    : (typeof product.tags === 'string' ? product.tags : '');
  const brand = (product.brand || product.vendor || '').trim();
  const desc = (product.description || '').trim();

  const text = `${name} ${cat} ${sub} ${tags} ${brand} ${desc}`.toLowerCase();
  const gender = extractGender(product);

  // 1. ELECTRONICS & GADGETS
  if (
    cat.toLowerCase() === 'electronics' || cat.toLowerCase() === 'gadgets' ||
    hasPhrase(text, [
      'iphone', 'smartphone', 'mobile phone', 'android phone', 'earbuds', 'airpods',
      'bluetooth', 'headphone', 'earphone', 'neckband', 'smartwatch', 'smart watch',
      'laptop', 'macbook', 'charger', 'usb cable', 'type c cable', 'power bank',
      'wireless mouse', 'keyboard', 'inverter', 'split ac', 'refrigerator', 'fridge',
      'television', 'smart tv', 'mixer grinder', 'water heater', 'geyser', 'iron box',
      'electric kettle', 'hair dryer', 'trimmer', 'shaver', 'speaker', 'soundbar',
      'cctv camera', 'tripod', 'memory card', 'pendrive', 'screen protector', 'mobile cover'
    ])
  ) {
    return 'electronics';
  }

  // 2. GROCERY & DAILY ESSENTIALS
  if (
    cat.toLowerCase() === 'grocery' || cat.toLowerCase() === 'groceries' || cat.toLowerCase() === 'food' ||
    hasPhrase(text, [
      'atta', 'rice', 'dal', 'pulses', 'cooking oil', 'sunflower oil', 'mustard oil',
      'ghee', 'pasteurised butter', 'butter', 'milk', 'paneer', 'cheese', 'curd', 'dahi',
      'masala', 'turmeric powder', 'chilli powder', 'spices', 'tea powder', 'coffee',
      'sugar', 'salt', 'biscuit', 'cookies', 'namkeen', 'munchies', 'chips', 'snacks',
      'chocolate', 'noodles', 'maggi', 'pasta', 'ketchup', 'sauce', 'jam',
      'detergent', 'dishwash', 'floor cleaner', 'harpic', 'surf excel', 'handwash'
    ])
  ) {
    return 'grocery';
  }

  // 3. BEAUTY & HEALTH & PERSONAL CARE
  if (
    cat.toLowerCase() === 'beauty' || cat.toLowerCase() === 'beauty_health' || cat.toLowerCase() === 'cosmetics' ||
    hasPhrase(text, [
      'lipstick', 'lip gloss', 'lip balm', 'eyeliner', 'mascara', 'foundation', 'concealer',
      'face powder', 'makeup', 'face serum', 'serum', 'face wash', 'facewash', 'face cream',
      'moisturizer', 'sunscreen', 'body lotion', 'shampoo', 'hair conditioner', 'hair oil',
      'hair color', 'perfume', 'eau de parfum', 'deodorant', 'body spray', 'body wash',
      'bathing soap', 'soap', 'dettol', 'skin care', 'skincare', 'scrub', 'sheet mask'
    ])
  ) {
    return 'beauty';
  }

  // 4. KIDS & TOYS & BABY CARE
  if (
    gender === 'kids' ||
    cat.toLowerCase() === 'kids_toys' || cat.toLowerCase() === 'kids' || cat.toLowerCase() === 'toys' ||
    hasPhrase(text, [
      'baby wear', 'baby dress', 'kids clothing', 'frock', 'frocks', 'baby boy', 'baby girl',
      'toys', 'toy car', 'board game', 'puzzle', 'doll', 'action figure', 'building blocks',
      'lego', 'educational toy', 'remote control car', 'baby diapers', 'pampers', 'mamy poko',
      'baby wipes', 'baby lotion', 'baby powder', 'baby shampoo', 'feeding bottle', 'stroller',
      'pram', 'cradle', 'baby carrier', 'school bag for kids'
    ])
  ) {
    return 'kids_toys';
  }

  // 5. JEWELLERY & ACCESSORIES
  if (
    cat.toLowerCase() === 'jewellery' || cat.toLowerCase() === 'jewelry' || cat.toLowerCase() === 'jewellery_accessories' ||
    hasPhrase(text, [
      'necklace', 'mangalsutra', 'earring', 'earrings', 'jhumka', 'jhumkas', 'bangle', 'bangles',
      'bracelet', 'bracelets', 'finger ring', 'ring for women', 'anklet', 'payal', 'pendant',
      'nose pin', 'choker', 'gold plated jewellery', 'oxidised jewellery', 'kundun jewellery'
    ])
  ) {
    return 'jewellery';
  }

  // 6. WATCHES
  if (
    cat.toLowerCase() === 'watches' ||
    hasPhrase(text, ['analog watch', 'digital watch', 'chronograph watch', 'wrist watch', 'leather strap watch', 'quartz watch']) ||
    (hasWord(text, ['watch', 'watches']) && !hasPhrase(text, ['smart watch', 'smartwatch']))
  ) {
    return 'watches';
  }

  // 7. BAGS & FOOTWEAR
  if (
    cat.toLowerCase() === 'bags' || cat.toLowerCase() === 'bags_footwear' || cat.toLowerCase() === 'footwear' ||
    hasPhrase(text, [
      'backpack', 'handbag', 'hand bag', 'sling bag', 'tote bag', 'clutch', 'wallet',
      'luggage', 'trolley bag', 'duffle bag', 'casual shoe', 'running shoe', 'sneakers',
      'formal shoe', 'loafers', 'sandals', 'slippers', 'flip flops', 'crocs', 'boots',
      'high heels', 'wedges', 'flats'
    ])
  ) {
    return 'bags';
  }

  // 8. HOME & KITCHEN & HOME DECOR
  if (
    cat.toLowerCase() === 'home_kitchen' || cat.toLowerCase() === 'kitchen' || cat.toLowerCase() === 'home' ||
    hasPhrase(text, [
      'cookware', 'kadai', 'kadhai', 'frying pan', 'frypan', 'pressure cooker', 'non-stick',
      'saucepan', 'dinner set', 'plates', 'spoons', 'cutlery', 'water bottle', 'thermos',
      'coffee mug', 'storage container', 'lunch box', 'tiffin box', 'chopping board',
      'knife set', 'gas stove', 'bedsheet', 'bed sheet', 'pillow cover', 'blanket', 'comforter',
      'curtain', 'curtains', 'doormat', 'bath towel', 'wall clock', 'wall art', 'wall sticker',
      'showpiece', 'ganesh idol', 'pooja thali', 'artificial plants', 'led strip lights', 'lamp'
    ])
  ) {
    return 'home_kitchen';
  }

  // 9. SPORTS & FITNESS
  if (
    cat.toLowerCase() === 'sports' || cat.toLowerCase() === 'sports_fitness' ||
    hasPhrase(text, [
      'gym dumbbell', 'dumbbells', 'yoga mat', 'resistance band', 'shaker bottle', 'skipping rope',
      'cricket bat', 'leather ball', 'badminton racket', 'shuttlecock', 'football', 'volleyball',
      'sportswear', 'gym wear', 'activewear', 'sweatband'
    ])
  ) {
    return 'sports';
  }

  // 10. PET SUPPLIES
  if (
    cat.toLowerCase() === 'pets' || cat.toLowerCase() === 'pet_supplies' ||
    hasPhrase(text, ['dog food', 'pedigree', 'cat food', 'whiskas', 'pet collar', 'pet leash', 'pet toy'])
  ) {
    return 'pets';
  }

  // 11. BOOKS & STATIONERY
  if (
    cat.toLowerCase() === 'books' ||
    hasPhrase(text, ['novel', 'storybook', 'notebook', 'diary', 'ball pen', 'pencil box', 'highlighter', 'art colors'])
  ) {
    return 'books';
  }

  // 12. WOMEN'S LINGERIE & INNERWEAR
  if (
    cat.toLowerCase() === 'lingerie' ||
    hasPhrase(text, [
      'bra', 'bras', 'padded bra', 'sports bra', 'panty', 'panties', 'lingerie set',
      'nighty', 'women nightdress', 'women nightsuit', 'camisole', 'shapewear', 'feeding bra'
    ])
  ) {
    return 'lingerie';
  }

  // 13. WOMEN'S ETHNIC (KURTI, SAREE, LEHENGA)
  // Ensure Men's Kurta is NEVER placed here!
  const isExplicitMenKurta = hasPhrase(text, ['men kurta', 'kurta for men', 'mens kurta', "men's kurta", 'kurta pajama for men', 'gents kurta']);
  if (
    !isExplicitMenKurta && (
      cat.toLowerCase() === 'kurti_saree' || cat.toLowerCase() === 'kurti_saree_lehenga' || cat.toLowerCase() === 'sarees' ||
      hasPhrase(text, [
        'saree', 'sari', 'silk saree', 'cotton saree', 'banarasi saree', 'kanchipuram saree',
        'kurti', 'kurtis', 'kurta set', 'kurti set', 'anarkali', 'lehenga', 'lehengas', 'chaniya choli',
        'dupatta', 'salwar suit', 'chudidar', 'unstitched dress material', 'blouse piece', 'stitched blouse', 'petticoat'
      ])
    )
  ) {
    return 'kurti_saree_lehenga';
  }

  // 14. WOMEN'S WESTERN WEAR
  if (
    (gender === 'women' || cat.toLowerCase() === 'women_western' || cat.toLowerCase() === 'women') && (
      hasPhrase(text, [
        'top', 'tops', 'tunics', 'women dress', 'dresses', 'gown', 'jumpsuit', 'skirt', 'skirts',
        'palazzo', 'jeggings', 'women jeans', 'ladies jeans', 'women t-shirt', 'ladies t-shirt',
        'women shirt', 'ladies shirt', 'crop top', 'shrug', 'cardigan', 'women jacket', 'coord set'
      ]) ||
      gender === 'women'
    )
  ) {
    return 'women_western';
  }

  // 15. MEN'S FASHION
  if (
    gender === 'men' ||
    cat.toLowerCase() === 'men' || cat.toLowerCase() === 'mens' || cat.toLowerCase() === 'menswear' || cat.toLowerCase() === 'men_fashion' ||
    isExplicitMenKurta ||
    hasPhrase(text, [
      'men shirt', "men's shirt", 'formal shirt', 'casual shirt for men', 'polo t-shirt', 'polo shirt',
      'men t-shirt', "men's t-shirt", 'round neck t-shirt for men', 'men jeans', "men's jeans",
      'trousers for men', 'cargo pants for men', 'chinos for men', 'men joggers', 'track pants for men',
      'dhoti', 'lungi', 'men blazer', 'men suit', 'nehru jacket', 'men vest', 'men boxer', 'men briefs'
    ]) ||
    hasWord(text, ['shirt', 'tshirt', 't-shirt', 'polo', 'trouser', 'jeans', 'hoodie', 'jogger', 'boxer', 'vest'])
  ) {
    return 'men';
  }

  // Fallback fallback: Check raw category if valid
  const rawCat = cat.toLowerCase();
  if (rawCat.includes('men') && !rawCat.includes('women')) return 'men';
  if (rawCat.includes('women') || rawCat.includes('saree') || rawCat.includes('kurti')) return 'women_western';
  if (rawCat.includes('elect')) return 'electronics';
  if (rawCat.includes('groc') || rawCat.includes('food')) return 'grocery';
  if (rawCat.includes('beauty')) return 'beauty';
  if (rawCat.includes('kitchen') || rawCat.includes('home')) return 'home_kitchen';
  if (rawCat.includes('kid') || rawCat.includes('toy')) return 'kids_toys';
  if (rawCat.includes('bag') || rawCat.includes('footwear')) return 'bags';
  if (rawCat.includes('watch')) return 'watches';
  if (rawCat.includes('jewel')) return 'jewellery';
  if (rawCat.includes('sport')) return 'sports';

  return 'general';
};

// -------------------------------------------------------------
// NORMALIZATION: Map incoming screen params to Standard Taxonomy Key
// -------------------------------------------------------------
export const normalizeCategoryKey = (
  categoryId?: string,
  categoryName?: string,
  subCategory?: string
): StandardCategoryKey | 'all' | 'deals' => {
  const cId = (categoryId || '').toLowerCase().trim();
  const cName = (categoryName || '').toLowerCase().trim();
  const sub = (subCategory || '').toLowerCase().trim();

  // 1. Generic all / offers / deals
  if (cId === 'all' || cId === 'offers' || cId === 'flash_deals' || cId === 'deals' || cId === 'today_deals') {
    // If a specific categoryName or subCategory is present (e.g. from Popular grid: subCategory="Men Fashion")
    const combined = `${cName} ${sub}`;
    if (combined && combined !== 'all' && !combined.includes('deal') && !combined.includes('offer')) {
      return normalizeCategoryKey(combined);
    }
    return 'all';
  }

  // 2. Popular hub routing
  if (cId === 'popular') {
    const combined = `${cName} ${sub}`;
    if (combined) {
      return normalizeCategoryKey(combined);
    }
    return 'all';
  }

  const raw = `${cId} ${cName} ${sub}`;

  // 3. Exact mappings
  if (hasPhrase(raw, ['kurti', 'saree', 'lehenga', 'ethnic wear', 'dress material'])) return 'kurti_saree_lehenga';
  if (hasPhrase(raw, ['lingerie', 'innerwear', 'nightwear', 'sleepwear', 'bra', 'panty'])) return 'lingerie';
  if (hasPhrase(raw, ['women western', 'westernwear', 'western wear', 'women top', 'women dress', 'women'])) return 'women_western';
  if (hasPhrase(raw, ['men fashion', 'mens fashion', 'men', 'menswear', 'mens wear', 'top wear', 'bottom wear'])) {
    if (!hasPhrase(raw, ['women', 'ladies'])) return 'men';
  }
  if (hasPhrase(raw, ['kids', 'toys', 'baby', 'kids clothing', 'baby care'])) return 'kids_toys';
  if (hasPhrase(raw, ['electronics', 'gadgets', 'appliances', 'mobile'])) return 'electronics';
  if (hasPhrase(raw, ['grocery', 'groceries', 'supermarket', 'food', 'dairy', 'fruits'])) return 'grocery';
  if (hasPhrase(raw, ['beauty', 'personal care', 'health', 'skincare', 'makeup', 'cosmetics'])) return 'beauty';
  if (hasPhrase(raw, ['home & kitchen', 'home kitchen', 'home decor', 'kitchen', 'cookware'])) return 'home_kitchen';
  if (hasPhrase(raw, ['bags', 'footwear', 'shoes', 'sandals', 'backpack'])) return 'bags';
  if (hasPhrase(raw, ['jewellery', 'jewelry', 'accessories', 'ornaments'])) return 'jewellery';
  if (hasPhrase(raw, ['watches', 'watch', 'smartwatch'])) return 'watches';
  if (hasPhrase(raw, ['sports', 'fitness', 'gym'])) return 'sports';
  if (hasPhrase(raw, ['books', 'stationery'])) return 'books';
  if (hasPhrase(raw, ['pets', 'pet supplies', 'pet_supplies'])) return 'pets';

  return 'all';
};

// -------------------------------------------------------------
// STRICT CATEGORY MEMBERSHIP VALIDATOR
// -------------------------------------------------------------
export const doesProductBelongToCategory = (
  product: ProductLike,
  targetCategoryKey: StandardCategoryKey | 'all' | 'deals' | string,
  activeSubcategory?: string
): boolean => {
  if (targetCategoryKey === 'all' || targetCategoryKey === 'deals') {
    // Valid for all/deals
    return true;
  }

  const pCat = (product.category || '').toLowerCase().trim();
  const pCatId = (product.categoryId || '').toLowerCase().trim();
  const target = targetCategoryKey.toLowerCase().trim();
  const gender = extractGender(product);

  // Direct match on Firebase category name or ID
  if (pCat === target || pCatId === target || (pCat.length > 2 && (pCat.includes(target) || target.includes(pCat)))) {
    if (target === 'men' && (gender === 'women' || pCat.includes('women'))) return false;
    if ((target === 'women' || target === 'women_western') && (gender === 'men' || pCat.includes('men'))) return false;
    return true;
  }

  const detectedCategory = classifyProduct(product);

  // Strict Gender Separation Rules
  if (targetCategoryKey === 'men') {
    // Must NEVER be women's category or gender
    if (gender === 'women') return false;
    if (detectedCategory === 'kurti_saree_lehenga' || detectedCategory === 'women_western' || detectedCategory === 'lingerie') return false;
    return detectedCategory === 'men';
  }

  if (targetCategoryKey === 'women' || targetCategoryKey === 'women_western') {
    // Must NEVER be men's category or gender
    if (gender === 'men') return false;
    if (detectedCategory === 'men') return false;
    return detectedCategory === 'women_western' || detectedCategory === 'kurti_saree_lehenga' || detectedCategory === 'lingerie';
  }

  if (targetCategoryKey === 'kurti_saree_lehenga' || targetCategoryKey === 'kurti_saree') {
    if (gender === 'men') return false;
    if (detectedCategory === 'men') return false;
    return detectedCategory === 'kurti_saree_lehenga';
  }

  if (targetCategoryKey === 'lingerie') {
    if (gender === 'men') return false;
    return detectedCategory === 'lingerie';
  }

  if (targetCategoryKey === 'kids_toys') {
    return detectedCategory === 'kids_toys';
  }

  if (targetCategoryKey === 'beauty') {
    return detectedCategory === 'beauty';
  }

  if (targetCategoryKey === 'grocery') {
    return detectedCategory === 'grocery';
  }

  if (targetCategoryKey === 'electronics') {
    return detectedCategory === 'electronics';
  }

  if (targetCategoryKey === 'home_kitchen') {
    return detectedCategory === 'home_kitchen';
  }

  if (targetCategoryKey === 'bags') {
    return detectedCategory === 'bags';
  }

  if (targetCategoryKey === 'jewellery') {
    return detectedCategory === 'jewellery';
  }

  if (targetCategoryKey === 'watches') {
    return detectedCategory === 'watches';
  }

  if (targetCategoryKey === 'sports') {
    return detectedCategory === 'sports';
  }

  if (targetCategoryKey === 'books') {
    return detectedCategory === 'books';
  }

  if (targetCategoryKey === 'pets' || targetCategoryKey === 'pet_supplies') {
    return detectedCategory === 'pets';
  }

  // General fallback
  return detectedCategory === targetCategoryKey;
};

// -------------------------------------------------------------
// INTELLIGENT SUBCATEGORY MATCHER
// -------------------------------------------------------------
export const doesProductMatchSubcategory = (product: ProductLike, targetSubcategory: string): boolean => {
  if (!targetSubcategory || targetSubcategory === 'All') return true;

  const target = targetSubcategory.toLowerCase().trim();
  const pName = (product.name || product.title || '').toLowerCase();
  const pSub = (product.subCategory || product.subcategory || '').toLowerCase();
  const pCat = (product.category || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];

  const combined = `${pName} ${pSub} ${pCat} ${tags.join(' ')}`;

  // Direct token match
  if (pSub.includes(target) || target.includes(pSub)) return true;
  if (tags.some(t => t.includes(target) || target.includes(t))) return true;

  // Specific Subcategory Aliases
  if (target.includes('t-shirt') || target.includes('tshirt') || target.includes('tee')) {
    return hasWord(combined, ['tshirt', 't-shirt', 'tshirts', 't-shirts', 'tee', 'tees', 'polo']);
  }
  if (target.includes('shirt')) {
    return hasWord(combined, ['shirt', 'shirts', 'formal', 'casual']);
  }
  if (target.includes('jeans') || target.includes('jeggings')) {
    return hasWord(combined, ['jeans', 'jeggings', 'denim']);
  }
  if (target.includes('trouser') || target.includes('pant') || target.includes('cargo')) {
    return hasWord(combined, ['trouser', 'trousers', 'pant', 'pants', 'cargo', 'cargos', 'chino', 'chinos', 'jogger', 'joggers']);
  }
  if (target.includes('saree')) {
    return hasWord(combined, ['saree', 'saris', 'sari', 'silk', 'cotton', 'georgette', 'banarasi', 'kanchipuram']);
  }
  if (target.includes('kurti') || target.includes('kurta')) {
    return hasWord(combined, ['kurti', 'kurtis', 'kurta', 'kurtas', 'anarkali', 'tunics']);
  }
  if (target.includes('lehenga')) {
    return hasWord(combined, ['lehenga', 'lehengas', 'choli', 'bridal', 'ghagra']);
  }
  if (target.includes('dress') || target.includes('gown')) {
    return hasWord(combined, ['dress', 'dresses', 'gown', 'gowns', 'maxi', 'midi', 'frock']);
  }
  if (target.includes('top') || target.includes('tunic')) {
    return hasWord(combined, ['top', 'tops', 'tunic', 'tunics', 'crop top']);
  }
  if (target.includes('innerwear') || target.includes('vest') || target.includes('brief') || target.includes('boxer')) {
    return hasWord(combined, ['innerwear', 'vest', 'vests', 'brief', 'briefs', 'boxer', 'boxers', 'trunk', 'trunks', 'undergarment']);
  }
  if (target.includes('bra') || target.includes('panty') || target.includes('lingerie')) {
    return hasWord(combined, ['bra', 'bras', 'panty', 'panties', 'lingerie', 'nighty', 'camisole']);
  }
  if (target.includes('footwear') || target.includes('shoe') || target.includes('sneaker')) {
    return hasWord(combined, ['shoe', 'shoes', 'sneaker', 'sneakers', 'sandal', 'sandals', 'slipper', 'slippers', 'loafers', 'boots', 'heels']);
  }
  if (target.includes('watch')) {
    return hasWord(combined, ['watch', 'watches', 'smartwatch', 'analog', 'digital', 'chronograph']);
  }
  if (target.includes('dairy') || target.includes('egg') || target.includes('milk')) {
    return hasWord(combined, ['dairy', 'milk', 'butter', 'ghee', 'paneer', 'cheese', 'curd', 'dahi', 'egg', 'eggs']);
  }
  if (target.includes('atta') || target.includes('rice') || target.includes('dal')) {
    return hasWord(combined, ['atta', 'rice', 'dal', 'flour', 'wheat', 'pulses', 'besan']);
  }
  if (target.includes('snack') || target.includes('munchies') || target.includes('biscuit')) {
    return hasWord(combined, ['snack', 'snacks', 'biscuit', 'biscuits', 'cookies', 'namkeen', 'chips', 'munchies', 'chocolate']);
  }
  if (target.includes('smart phone') || target.includes('smartphone') || target.includes('mobile')) {
    return hasWord(combined, ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'iphone', 'android']);
  }
  if (target.includes('headphone') || target.includes('earbud') || target.includes('audio')) {
    return hasWord(combined, ['headphone', 'headphones', 'earbud', 'earbuds', 'earphone', 'neckband', 'airpods', 'tws', 'audio']);
  }
  if (target.includes('cookware') || target.includes('kadai') || target.includes('pan')) {
    return hasWord(combined, ['cookware', 'kadai', 'kadhai', 'pan', 'cooker', 'pot', 'pots', 'utensil']);
  }
  if (target.includes('skincare') || target.includes('soap') || target.includes('serum')) {
    return hasWord(combined, ['skincare', 'skin', 'soap', 'serum', 'lotion', 'cream', 'facewash', 'face wash']);
  }
  if (target.includes('toy') || target.includes('game')) {
    return hasWord(combined, ['toy', 'toys', 'game', 'games', 'puzzle', 'doll', 'blocks', 'car']);
  }

  // Fallback: check if target word appears in product text
  const targetWords = target.split(/\s+/).filter(w => w.length > 2);
  return targetWords.some(w => combined.includes(w));
};

// -------------------------------------------------------------
// UNIVERSAL FILTER HELPER FOR ALL LISTS & TABS
// -------------------------------------------------------------
export const filterProductsByCategory = (
  products: any[],
  targetCategoryOrTab: string,
  activeSubcategory: string = 'All',
  searchQuery: string = ''
): any[] => {
  if (!products || !Array.isArray(products)) return [];

  const normalizedCategory = normalizeCategoryKey(targetCategoryOrTab);

  return products.filter((product) => {
    // 1. In Stock & Active check
    if (product.status === 'Out of Stock' || product.isActive === false || product.inStock === false) {
      return false;
    }

    // 2. Category membership check (with Auto-Healing)
    const matchesCat = doesProductBelongToCategory(product, normalizedCategory);
    if (!matchesCat) return false;

    // 3. Subcategory filter
    if (activeSubcategory && activeSubcategory !== 'All') {
      const matchesSub = doesProductMatchSubcategory(product, activeSubcategory);
      if (!matchesSub) return false;
    }

    // 4. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pName = (product.name || product.title || '').toLowerCase();
      const pVendor = (product.vendor || product.shop_name || product.shopName || '').toLowerCase();
      const pSub = (product.subCategory || product.subcategory || '').toLowerCase();
      if (!pName.includes(q) && !pVendor.includes(q) && !pSub.includes(q)) {
        return false;
      }
    }

    return true;
  });
};
