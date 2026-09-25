// Pure dynamic Category types (No local static assets)
// All categories & subcategories are managed 100% live through Firebase Firestore ('categories' collection).

export interface CategoryConfig {
  id: string;
  name: string;
  label?: string;
  imageUrl?: string;
  image?: string;
  icon?: string;
  color?: string;
  order?: number;
  status?: 'active' | 'inactive';
  subcategories?: string[];
  bannerUrl?: string;
}

// Default empty fallback - all real data loads dynamically from Firebase
export const CATEGORIES: CategoryConfig[] = [];
