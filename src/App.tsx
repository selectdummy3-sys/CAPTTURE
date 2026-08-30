import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { RequireAdmin, RequireAuth, RequireSeller, LoadingScreen } from "@/components/guards";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
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

const AccountLayout = lazy(() => import("@/pages/account/AccountLayout").then((m) => ({ default: m.AccountLayout })));
const AccountOverview = lazy(() =>
  import("@/pages/account/AccountOverview").then((m) => ({ default: m.AccountOverview }))
);
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const OrdersPage = lazy(() => import("@/pages/account/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() =>
  import("@/pages/account/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const WishlistPage = lazy(() => import("@/pages/account/WishlistPage").then((m) => ({ default: m.WishlistPage })));
const NotificationsPage = lazy(() =>
  import("@/pages/account/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
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
const AdminTeam = lazy(() =>
  import("@/pages/admin/AdminTeam").then((m) => ({ default: m.AdminTeam }))
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
  return (
    <Loadable>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/p/:slug" element={<ProductDetailPage />} />
          <Route path="/store/:username" element={<StorePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/order/success" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
          <Route path="/order/payment/return" element={<PaymentReturnPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/about" element={<StaticPage page="about" />} />
          <Route path="/terms" element={<StaticPage page="terms" />} />
          <Route path="/privacy" element={<StaticPage page="privacy" />} />
          <Route path="/help" element={<StaticPage page="help" />} />
          <Route path="/contact" element={<StaticPage page="contact" />} />
          <Route path="/sell/apply" element={<RequireAuth><SellerApplyPage /></RequireAuth>} />
        </Route>

        <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
          <Route index element={<AccountOverview />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

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

        <Route path="/supplies" element={<RequireAuth><RequireSeller><SupplyLayout /></RequireSeller></RequireAuth>}>
          <Route index element={<SuppliesHomePage />} />
          <Route path="shop" element={<SuppliesShopPage />} />
          <Route path="product/:slug" element={<SupplyProductPage />} />
          <Route path="cart" element={<SupplyCartPage />} />
          <Route path="checkout" element={<SupplyCheckoutPage />} />
          <Route path="orders" element={<SupplyOrdersPage />} />
          <Route path="order/success" element={<SupplySuccessPage />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="hero" element={<AdminHero />} />
          <Route path="collections" element={<AdminCategories />} />
          <Route path="supplies" element={<AdminSupplyOverview />} />
          <Route path="supplies/products" element={<AdminSupplyProducts />} />
          <Route path="supplies/categories" element={<AdminSupplyCategories />} />
          <Route path="supplies/orders" element={<AdminSupplyOrders />} />
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
    </Loadable>
  );
}
