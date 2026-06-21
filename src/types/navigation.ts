export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  OTPVerify: { phone: string; confirmation: any };
  MainTabs: undefined;
  ProductDetail: { id: string };
  Cart: undefined;
  Checkout: undefined;
  Search: { query?: string };
  Wishlist: undefined;
  ShopDetail: { shopId: string };
  Notifications: undefined;
  Addresses: undefined;
  OrderDetail: { orderId: string };
  OrderSuccess: { orderId: string };
};
