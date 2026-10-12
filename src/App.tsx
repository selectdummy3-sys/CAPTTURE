import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { AppTabBar } from "@/components/storefront/AppTabBar";
import { RequireAdmin, RequireApprovedSeller, RequireAuth, RequirePermission, RequireSeller, LoadingScreen } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { isNative } from "@/lib/capacitor";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const AppHomePage = lazy(() => import("@/pages/AppHomePage").then((m) => ({ default: m.AppHomePage })));
const ShopPage = lazy(() => import("@/pages/ShopPage").then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() =>
  import("@/pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const StorePage = lazy(() => import("@/pages/StorePage").then((m) => ({ default: m.StorePage })));
const StoresPage = lazy(() => import("@/pages/StoresPage").then((m) => ({ default: m.StoresPage })));
const CartPage = lazy(() => import("@/pages/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() =>
  import("@/pages/OrderSuccessPage").then((m) => ({ default: m.OrderSuccessPage }))
);
const PaymentReturnPage = lazy(() =>
  import("@/pages/PaymentReturnPage").then((m) => ({ default: m.PaymentReturnPage }))
);
const SellPage = lazy(() => import("@/pages/SellPage").then((m) => ({ default: m.SellPage })));
const TrackOrderPage = lazy(() =>
  import("@/pages/TrackOrderPage").then((m) => ({ default: m.TrackOrderPage }))
);
const StaticPage = lazy(() => import("@/pages/StaticPages").then((m) => ({ default: m.StaticPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage").then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const AuthCallbackPage = lazy(() =>
  import("@/pages/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);
const EmailConfirmedPage = lazy(() =>
  import("@/pages/auth/EmailConfirmedPage").then((m) => ({ default: m.EmailConfirmedPage }))
);

const AccountOverview = lazy(() =>
  import("@/pages/account/AccountOverview").then((m) => ({ default: m.AccountOverview }))
);
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const CustomerSupportScreen = lazy(() =>
  import("@/pages/support/CustomerSupportScreen").then((m) => ({ default: m.CustomerSupportScreen }))
);
const OrdersPage = lazy(() => import("@/pages/account/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() =>
  import("@/pages/account/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const WishlistPage = lazy(() => import("@/pages/account/WishlistPage").then((m) => ({ default: m.WishlistPage })));
const SupportTicketsPage = lazy(() =>
  import("@/pages/account/SupportTicketsPage").then((m) => ({ default: m.SupportTicketsPage }))
);
const NotificationsPage = lazy(() =>
  import("@/pages/account/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
);
const AddressBookPage = lazy(() =>
  import("@/pages/account/AddressBookPage").then((m) => ({ default: m.AddressBookPage }))
);
const PreferencesPage = lazy(() =>
  import("@/pages/account/PreferencesPage").then((m) => ({ default: m.PreferencesPage }))
);

const SellerLayout = lazy(() => import("@/pages/seller/SellerLayout").then((m) => ({ default: m.SellerLayout })));
const SellerDashboard = lazy(() =>
  import("@/pages/seller/SellerDashboard").then((m) => ({ default: m.SellerDashboard }))
);
const SellerProducts = lazy(() =>
  import("@/pages/seller/SellerProducts").then((m) => ({ default: m.SellerProducts }))
);
const ProductFormPage = lazy(() =>
  import("@/pages/seller/ProductFormPage").then((m) => ({ default: m.ProductFormPage }))
);
const SellerOrders = lazy(() => import("@/pages/seller/SellerOrders").then((m) => ({ default: m.SellerOrders })));
const SellerAnalytics = lazy(() =>
  import("@/pages/seller/SellerAnalytics").then((m) => ({ default: m.SellerAnalytics }))
);
const SellerEarnings = lazy(() =>
  import("@/pages/seller/SellerEarnings").then((m) => ({ default: m.SellerEarnings }))
);
const SellerFollowers = lazy(() =>
  import("@/pages/seller/SellerFollowers").then((m) => ({ default: m.SellerFollowers }))
);
const SellerPromotions = lazy(() =>
  import("@/pages/seller/SellerPromotions").then((m) => ({ default: m.SellerPromotions }))
);
const SellerNotifications = lazy(() =>
  import("@/pages/seller/SellerNotifications").then((m) => ({ default: m.SellerNotifications }))
);
const SellerSettings = lazy(() =>
  import("@/pages/seller/SellerSettings").then((m) => ({ default: m.SellerSettings }))
);
const SellerApplyPage = lazy(() =>
  import("@/pages/seller/SellerApplyPage").then((m) => ({ default: m.SellerApplyPage }))
);

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const AdminProducts = lazy(() =>
  import("@/pages/admin/AdminProducts").then((m) => ({ default: m.AdminProducts }))
);
const AdminSellers = lazy(() => import("@/pages/admin/AdminSellers").then((m) => ({ default: m.AdminSellers })));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders").then((m) => ({ default: m.AdminOrders })));
const AdminCoupons = lazy(() => import("@/pages/admin/AdminCoupons").then((m) => ({ default: m.AdminCoupons })));
const AdminMessages = lazy(() =>
  import("@/pages/admin/AdminMessages").then((m) => ({ default: m.default }))
);
const AdminSupport = lazy(() =>
  import("@/pages/admin/AdminSupport").then((m) => ({ default: m.default }))
);
const AdminHero = lazy(() =>
  import("@/pages/admin/AdminHero").then((m) => ({ default: m.AdminHero }))
);
const AdminCategories = lazy(() =>
  import("@/pages/admin/AdminCategories").then((m) => ({ default: m.AdminCategories }))
);

const SellerInbox = lazy(() =>
  import("@/pages/seller/SellerInbox").then((m) => ({ default: m.default }))
);
const SellerWithdrawals = lazy(() =>
  import("@/pages/seller/SellerWithdrawals").then((m) => ({ default: m.default }))
);
const AdminWithdrawals = lazy(() =>
  import("@/pages/admin/AdminWithdrawals").then((m) => ({ default: m.default }))
);
const AdminSettings = lazy(() =>
  import("@/pages/admin/AdminSettings").then((m) => ({ default: m.default }))
);
const AdminAppSettings = lazy(() =>
  import("@/pages/admin/AdminAppSettings").then((m) => ({ default: m.default }))
);
const AdminBanners = lazy(() =>
  import("@/pages/admin/AdminBanners").then((m) => ({ default: m.AdminBanners }))
);
const AdminTeam = lazy(() =>
  import("@/pages/admin/AdminTeam").then((m) => ({ default: m.AdminTeam }))
);
const AdminHome = lazy(() =>
  import("@/pages/admin/AdminHome").then((m) => ({ default: m.AdminHome }))
);
const AuditLog = lazy(() =>
  import("@/pages/admin/AuditLog").then((m) => ({ default: m.AuditLog }))
);
const AdminStaff = lazy(() =>
  import("@/pages/admin/AdminStaff").then((m) => ({ default: m.AdminStaff }))
);
const AdminQueue = lazy(() =>
  import("@/pages/admin/AdminQueue").then((m) => ({ default: m.default }))
);

const SupplyLayout = lazy(() =>
  import("@/components/supply/SupplyLayout").then((m) => ({ default: m.SupplyLayout }))
);
const SuppliesHomePage = lazy(() =>
  import("@/pages/supply/SuppliesHomePage").then((m) => ({ default: m.SuppliesHomePage }))
);
const SuppliesShopPage = lazy(() =>
  import("@/pages/supply/SuppliesShopPage").then((m) => ({ default: m.SuppliesShopPage }))
);
const SupplyProductPage = lazy(() =>
  import("@/pages/supply/SupplyProductPage").then((m) => ({ default: m.SupplyProductPage }))
);
const SupplyCartPage = lazy(() =>
  import("@/pages/supply/SupplyCartPage").then((m) => ({ default: m.SupplyCartPage }))
);
const SupplyCheckoutPage = lazy(() =>
  import("@/pages/supply/SupplyCheckoutPage").then((m) => ({ default: m.SupplyCheckoutPage }))
);
const SupplyOrdersPage = lazy(() =>
  import("@/pages/supply/SupplyOrdersPage").then((m) => ({ default: m.SupplyOrdersPage }))
);
const SupplySuccessPage = lazy(() =>
  import("@/pages/supply/SupplySuccessPage").then((m) => ({ default: m.SupplySuccessPage }))
);
const AdminSupplyOverview = lazy(() =>
  import("@/pages/admin/AdminSupplyOverview").then((m) => ({ default: m.AdminSupplyOverview }))
);
const AdminSupplyProducts = lazy(() =>
  import("@/pages/admin/AdminSupplyProducts").then((m) => ({ default: m.AdminSupplyProducts }))
);
const AdminSupplyCategories = lazy(() =>
  import("@/pages/admin/AdminSupplyCategories").then((m) => ({ default: m.AdminSupplyCategories }))
);
const AdminSupplyOrders = lazy(() =>
  import("@/pages/admin/AdminSupplyOrders").then((m) => ({ default: m.AdminSupplyOrders }))
);

function Loadable({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

export function App() {
  usePushNotifications();
  return (
    <Loadable>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={isNative ? <AppHomePage /> : <HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/p/:slug" element={<ProductDetailPage />} />
          <Route path="/store/:username" element={<StorePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/order/success" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
          <Route path="/order/payment/return" element={<PaymentReturnPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/about" element={<StaticPage page="about" />} />
          <Route path="/terms" element={<StaticPage page="terms" />} />
          <Route path="/seller-terms" element={<StaticPage page="seller-terms" />} />
          <Route path="/privacy" element={<StaticPage page="privacy" />} />
          <Route path="/help" element={<StaticPage page="help" />} />
          <Route path="/contact" element={<StaticPage page="contact" />} />
          <Route path="/sell/apply" element={<RequireAuth><SellerApplyPage /></RequireAuth>} />
        </Route>

        <Route path="/account" element={<AccountOverview />} />

        <Route path="/account/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/account/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/account/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
        <Route path="/account/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/account/addresses" element={<RequireAuth><AddressBookPage /></RequireAuth>} />
        <Route path="/account/preferences" element={<RequireAuth><PreferencesPage /></RequireAuth>} />
        <Route path="/account/support" element={<RequireAuth><SupportTicketsPage /></RequireAuth>} />

        <Route path="/account/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/support" element={<CustomerSupportScreen />} />

        <Route path="/seller" element={<RequireAuth><RequireSeller><SellerLayout /></RequireSeller></RequireAuth>}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="earnings" element={<SellerEarnings />} />
          <Route path="followers" element={<SellerFollowers />} />
          <Route path="promotions" element={<SellerPromotions />} />
          <Route path="notifications" element={<SellerNotifications />} />
          <Route path="inbox" element={<SellerInbox />} />
          <Route path="withdrawals" element={<SellerWithdrawals />} />
          <Route path="settings" element={<SellerSettings />} />
        </Route>

        <Route path="/supplies" element={<RequireAuth><RequireApprovedSeller><SupplyLayout /></RequireApprovedSeller></RequireAuth>}>
          <Route index element={<SuppliesHomePage />} />
          <Route path="shop" element={<SuppliesShopPage />} />
          <Route path="product/:slug" element={<SupplyProductPage />} />
          <Route path="cart" element={<SupplyCartPage />} />
          <Route path="checkout" element={<SupplyCheckoutPage />} />
          <Route path="orders" element={<SupplyOrdersPage />} />
          <Route path="order/success" element={<SupplySuccessPage />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminHome />} />
          <Route path="queue" element={<RequirePermission permission={PERMISSIONS.ordersView}><AdminQueue /></RequirePermission>} />
          <Route path="overview" element={<RequirePermission permission={PERMISSIONS.reportsView}><AdminDashboard /></RequirePermission>} />
          <Route path="products" element={<RequirePermission permission={PERMISSIONS.productsModerate}><AdminProducts /></RequirePermission>} />
          <Route path="sellers" element={<RequirePermission permission={PERMISSIONS.sellersReview}><AdminSellers /></RequirePermission>} />
          <Route path="orders" element={<RequirePermission permission={PERMISSIONS.ordersView}><AdminOrders /></RequirePermission>} />
          <Route path="withdrawals" element={<RequirePermission permission={PERMISSIONS.payoutsReview}><AdminWithdrawals /></RequirePermission>} />
          <Route path="settings" element={<RequirePermission permission={PERMISSIONS.systemSettingsManage}><AdminSettings /></RequirePermission>} />
          <Route path="team" element={<RequirePermission permission={PERMISSIONS.staffPermissionsManage}><AdminTeam /></RequirePermission>} />
          <Route path="access" element={<RequirePermission permission={PERMISSIONS.staffPermissionsManage}><AdminStaff /></RequirePermission>} />
          <Route path="audit" element={<RequirePermission permission={PERMISSIONS.auditView}><AuditLog /></RequirePermission>} />
          <Route path="app" element={<RequirePermission permission={PERMISSIONS.systemSettingsManage}><AdminAppSettings /></RequirePermission>} />
          <Route path="banners" element={<RequirePermission permission={PERMISSIONS.contentManage}><AdminBanners /></RequirePermission>} />
          <Route path="coupons" element={<RequirePermission permission={PERMISSIONS.promotionsManage}><AdminCoupons /></RequirePermission>} />
          <Route path="messages" element={<RequirePermission permission={PERMISSIONS.messagingSend}><AdminMessages /></RequirePermission>} />
          <Route path="support" element={<RequirePermission permission={PERMISSIONS.supportTicketsView}><AdminSupport /></RequirePermission>} />
          <Route path="hero" element={<RequirePermission permission={PERMISSIONS.contentManage}><AdminHero /></RequirePermission>} />
          <Route path="collections" element={<RequirePermission permission={PERMISSIONS.contentManage}><AdminCategories /></RequirePermission>} />
          <Route path="supplies" element={<RequirePermission permission={PERMISSIONS.suppliesManage}><AdminSupplyOverview /></RequirePermission>} />
          <Route path="supplies/products" element={<RequirePermission permission={PERMISSIONS.suppliesManage}><AdminSupplyProducts /></RequirePermission>} />
          <Route path="supplies/categories" element={<RequirePermission permission={PERMISSIONS.suppliesManage}><AdminSupplyCategories /></RequirePermission>} />
          <Route path="supplies/orders" element={<RequirePermission permission={PERMISSIONS.suppliesOrders}><AdminSupplyOrders /></RequirePermission>} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/email-confirmed" element={<EmailConfirmedPage />} />

        <Route path="*" element={<NotFoundPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        </Routes>
      <AppTabBar />
    </Loadable>
  );
}
