import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, setDoc, onSnapshot, orderBy, deleteDoc } from 'firebase/firestore';
import { Review } from '../store/slices/reviewSlice';
import { CartItem } from '../store/slices/cartSlice';
import { Coupon } from '../store/slices/couponSlice';

export const getProductById = async (productId: string): Promise<any> => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const getRelatedProducts = async (category: string, currentProductId: string) => {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    where('status', '==', 'Active')
  );
  const querySnapshot = await getDocs(q);
  const products: any[] = [];
  querySnapshot.forEach((doc) => {
    if (doc.id !== currentProductId) {
      products.push({ id: doc.id, ...doc.data() });
    }
  });
  return products.slice(0, 6);
};

export const getProductReviews = async (productId: string) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      )
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    // Reviews might be subcollection
    try {
      const snapshot = await getDocs(
        collection(db, 'products', productId, 'reviews')
      );
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      return [];
    }
  }
};

export const addReview = async (productId: string, reviewData: any) => {
  const reviewRef = await addDoc(collection(db, `products/${productId}/reviews`), {
    ...reviewData,
    createdAt: serverTimestamp(),
  });
  
  // Also update the product's average rating and review count
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    const data = productSnap.data();
    const currentRating = data.rating || 0;
    const currentCount = data.reviewCount || 0;
    
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;
    
    await updateDoc(productRef, {
      rating: Number(newRating.toFixed(1)),
      reviewCount: newCount,
    });
  }
  
  return reviewRef.id;
};

export const validateCoupon = async (code: string, subtotal: number) => {
  const cleanCode = code.trim().toUpperCase();
  try {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', cleanCode),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
      
      const expiry = coupon.expiryDate?.toDate?.() || (coupon.expiryDate ? new Date(coupon.expiryDate) : null);
      if (expiry && expiry < new Date())
        return { valid: false, message: 'Coupon has expired' };
      if (coupon.usedCount >= (coupon.usageLimit || Infinity))
        return { valid: false, message: 'Coupon usage limit reached' };
      if (subtotal < (coupon.minOrderValue || coupon.minPurchase || 0))
        return { valid: false, message: `Min order value ₹${coupon.minOrderValue || coupon.minPurchase} required` };
      
      const discount = coupon.type === 'flat' 
        ? coupon.value 
        : Math.min(
            (subtotal * coupon.value) / 100,
            coupon.maxDiscount || Infinity
          );
      
      return { valid: true, coupon, discount: Math.round(discount) };
    }
  } catch (e) {
    console.warn('Firestore coupon query check failed, trying fallback:', e);
  }

  // Fallback Promo Codes (e.g. BAZARPETH50, WELCOME50, FREESHIP)
  const defaultCoupons: Record<string, any> = {
    'BAZARPETH50': {
      code: 'BAZARPETH50',
      type: 'percentage',
      value: 50,
      maxDiscount: 150,
      minOrderValue: 199,
      description: '50% OFF up to ₹150 on orders above ₹199'
    },
    'WELCOME50': {
      code: 'WELCOME50',
      type: 'flat',
      value: 50,
      minOrderValue: 99,
      description: 'Flat ₹50 OFF on your first order'
    },
    'FREESHIP': {
      code: 'FREESHIP',
      type: 'flat',
      value: 40,
      minOrderValue: 149,
      description: 'Free Shipping on orders above ₹149'
    }
  };

  const matched = defaultCoupons[cleanCode];
  if (matched) {
    if (subtotal < matched.minOrderValue) {
      return { valid: false, message: `Min order value ₹${matched.minOrderValue} required for ${cleanCode}` };
    }
    const discount = matched.type === 'flat'
      ? matched.value
      : Math.min((subtotal * matched.value) / 100, matched.maxDiscount || Infinity);

    return { valid: true, coupon: matched, discount: Math.round(discount) };
  }

  return { valid: false, message: 'Invalid coupon code. Try BAZARPETH50 or WELCOME50' };
};

export const getAvailableCoupons = async (): Promise<Coupon[]> => {
  const q = query(collection(db, 'coupons'), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  const coupons: Coupon[] = [];
  querySnapshot.forEach((doc) => {
    coupons.push({ id: doc.id, ...doc.data() } as Coupon);
  });
  return coupons;
};

export const saveCartToFirestore = async (uid: string, items: CartItem[]) => {
  const cartRef = doc(db, 'carts', uid);
  await setDoc(cartRef, {
    items,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getStorefrontLayouts = async (city?: string) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'storefront_layouts'),
        where('isActive', '==', true)
      )
    );
    let layouts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (city) {
      layouts = layouts.filter((l: any) => !l.city || l.city === city || l.city === 'global' || l.city === 'national');
    }
    return layouts;
  } catch (error) {
    try {
      const snapshot = await getDocs(
        collection(db, 'storefront_layouts')
      );
      let layouts = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((l: any) => l.isActive !== false);
      if (city) {
        layouts = layouts.filter((l: any) => !l.city || l.city === city || l.city === 'global' || l.city === 'national');
      }
      return layouts;
    } catch (fallbackError) {
      console.error('getStorefrontLayouts completely failed:', fallbackError);
      return [];
    }
  }
};

export const saveUserPushToken = async (uid: string, token: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    pushToken: token,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// ----------------------------------------------------------------------
// ORDERS API
// ----------------------------------------------------------------------
export const createOrder = async (orderData: any) => {
  // Firestore strictly rejects `undefined` values in nested objects/arrays.
  // We use JSON parse/stringify to cleanly strip all undefined properties from the payload.
  const cleanOrderData = JSON.parse(JSON.stringify(orderData));

  const docRef = await addDoc(collection(db, 'orders'), {
    ...cleanOrderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getUserOrders = async (uid: string) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid)
  );
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return orders.sort((a: any, b: any) => {
    const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
};

export const subscribeToUserOrders = (uid: string, callback: (orders: any[]) => void) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid)
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id, ...doc.data()
    }));
    
    orders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    callback(orders);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: any) => void) => {
  const orderRef = doc(db, 'orders', orderId);
  return onSnapshot(orderRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
};

export const subscribeToRiderLocation = (riderId: string, callback: (locationData: any) => void) => {
  // Listen to rider_locations collection first
  const locationRef = doc(db, 'rider_locations', riderId);
  return onSnapshot(locationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      // Fallback check on delivery_partners collection if rider_locations doc is empty
      const partnerRef = doc(db, 'delivery_partners', riderId);
      getDoc(partnerRef).then((partnerSnap) => {
        if (partnerSnap.exists()) {
          const data = partnerSnap.data();
          if (data.location || (data.latitude && data.longitude)) {
            callback({
              latitude: data.latitude || data.location?.latitude,
              longitude: data.longitude || data.location?.longitude,
              heading: data.heading || 0,
              speed: data.speed || 0,
              updatedAt: data.updatedAt
            });
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      }).catch(() => callback(null));
    }
  });
};


// ----------------------------------------------------------------------
// ADDRESSES API
// ----------------------------------------------------------------------
export const saveAddress = async (uid: string, address: any) => {
  await setDoc(
    doc(db, 'users', uid, 'addresses', address.id || Date.now().toString()),
    address
  );
};

export const getUserAddresses = async (uid: string) => {
  const snapshot = await getDocs(
    collection(db, 'users', uid, 'addresses')
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteAddress = async (uid: string, addressId: string) => {
  await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
};

export const setDefaultAddress = async (uid: string, addressId: string) => {
  const addresses = await getUserAddresses(uid);
  const batchUpdates = addresses.map((addr) => {
    return updateDoc(doc(db, 'users', uid, 'addresses', addr.id), {
      isDefault: addr.id === addressId
    });
  });
  await Promise.all(batchUpdates);
};

// ----------------------------------------------------------------------
// PRODUCTS API
// ----------------------------------------------------------------------
export const getProducts = async (city?: string) => {
  try {
    const snapshot = await getDocs(query(collection(db, 'products')));
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (city) {
      products = products.filter((p: any) => !p.city || p.city === city || p.city === 'global' || p.city === 'national');
    }
    return products.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
};

// ----------------------------------------------------------------------
// LOCAL SHOPS API
// ----------------------------------------------------------------------
export const getLocalShops = async (city?: string) => {
  try {
    const snapshot = await getDocs(query(collection(db, 'local_shops')));
    let shops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (city) {
      shops = shops.filter((s: any) => !s.city || s.city === city || s.city === 'global' || s.city === 'national');
    }
    return shops;
  } catch (error) {
    console.error('getLocalShops error:', error);
    return [];
  }
};

export const createSampleBanners = async () => {
  const sampleBanners = [
    {
      title: "Summer Mega Sale 🔥",
      subtitle: "Up to 60% off — Today only",
      badge: "HOT DEAL",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
      ctaText: "Shop Now",
      bgColor: "#6B21A8",
      displayOrder: 1,
      status: "active",
      placement: "home"
    },
    {
      title: "Fresh Groceries 🌿",
      subtitle: "From local farms to your door",
      badge: "FRESH",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
      ctaText: "Order Now",
      bgColor: "#065F46",
      displayOrder: 2,
      status: "active",
      placement: "home"
    },
    {
      title: "Local Shops Sale 📍",
      subtitle: "Support neighborhood businesses",
      badge: "NEARBY",
      imageUrl: "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=800&q=80",
      ctaText: "Explore",
      bgColor: "#008B45",
      displayOrder: 3,
      status: "active",
      placement: "home"
    },
    {
      title: "Electronics Fest ⚡",
      subtitle: "Latest gadgets, best prices",
      badge: "NEW ARRIVALS",
      imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80",
      ctaText: "Browse",
      bgColor: "#1E40AF",
      displayOrder: 4,
      status: "active",
      placement: "home"
    },
    {
      title: "Flash Deals ⏰",
      subtitle: "Limited stock — Hurry!",
      badge: "LIMITED",
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80",
      ctaText: "Grab Now",
      bgColor: "#DC2626",
      displayOrder: 5,
      status: "active",
      placement: "home"
    },
  ];
  
  for (const banner of sampleBanners) {
    await addDoc(collection(db, 'banners'), {
      ...banner,
      createdAt: serverTimestamp()
    });
  }
};

// ----------------------------------------------------------------------
// BANNERS API
// ----------------------------------------------------------------------
export const getBanners = async (city?: string, targetTab?: string) => {
  try {
    const snapshot = await getDocs(collection(db, 'banners'));
    let banners = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (city) {
      banners = banners.filter((b: any) => !b.city || b.city === city || b.city === 'global' || b.city === 'national');
    }
    if (targetTab && targetTab !== 'ALL') {
      banners = banners.filter((b: any) => b.targetTab === targetTab || b.category === targetTab || b.placement === targetTab);
    }
    return banners.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('getBanners query failed:', error);
    return [];
  }
};

// ----------------------------------------------------------------------
// FLASH DEALS API
// ----------------------------------------------------------------------
export const getActiveFlashDeals = async () => {
  const now = new Date();
  try {
    const snapshot = await getDocs(collection(db, 'flash_deals'));
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter((deal: any) => {
        const start = deal.startTime?.toDate?.() || new Date(deal.startTime);
        const end = deal.endTime?.toDate?.() || new Date(deal.endTime);
        return now >= start && now <= end && deal.status !== 'expired';
      });
  } catch(e) {
    return [];
  }
};

// ----------------------------------------------------------------------
// CATEGORIES API
// ----------------------------------------------------------------------
export const getCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    return [];
  }
};

// ----------------------------------------------------------------------
// COUPONS API (ACTIVE)
// ----------------------------------------------------------------------
export const getActiveCoupons = async () => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'coupons'),
        where('isActive', '==', true)
      )
    );
    const now = new Date();
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter((c: any) => {
        const expiry = c.expiryDate?.toDate?.() || new Date(c.expiryDate);
        return expiry > now;
      });
  } catch(e) {
    return [];
  }
};
// ----------------------------------------------------------------------
// WISHLIST API
// ----------------------------------------------------------------------
export const toggleWishlistItem = async (uid: string, product: any) => {
  const docRef = doc(db, 'users', uid, 'wishlist', product.id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false; // Removed
  } else {
    await setDoc(docRef, { ...product, addedAt: serverTimestamp() });
    return true; // Added
  }
};

export const subscribeToWishlist = (uid: string, callback: (items: any[]) => void) => {
  return onSnapshot(collection(db, 'users', uid, 'wishlist'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

// ----------------------------------------------------------------------
// SAVED SHOPS API
// ----------------------------------------------------------------------
export const toggleSavedShop = async (uid: string, shop: any) => {
  const docRef = doc(db, 'users', uid, 'savedShops', shop.id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, { ...shop, savedAt: serverTimestamp() });
    return true;
  }
};

export const subscribeToSavedShops = (uid: string, callback: (shops: any[]) => void) => {
  return onSnapshot(collection(db, 'users', uid, 'savedShops'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};
