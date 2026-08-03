import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
const AdminSellers = lazy(() => import("@/pages/admin/AdminSellers").then((m) => ({ default: m.AdminSellers })));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders").then((m) => ({ default: m.AdminOrders })));
const AdminCoupons = lazy(() => import("@/pages/admin/AdminCoupons").then((m) => ({ default: m.AdminCoupons })));
const AdminMessages = lazy(() =>
  import("@/pages/admin/AdminMessages").then((m) => ({ default: m.default }))
);

const SellerInbox = lazy(() =>
  import("@/pages/seller/SellerInbox").then((m) => ({ default: m.default }))
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
          <Route path="inbox" element={<SellerInbox />} />
          <Route path="settings" element={<SellerSettings />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>

        <Route
          path="/login"
          element={
            <AuthLayout title="Welcome back" subtitle="Sign in to continue shopping.">
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthLayout title="Create your account" subtitle="Join CAPPTURE and start shopping local.">
              <SignupPage />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthLayout title="Reset your password" subtitle="We'll email you a reset link.">
              <ForgotPasswordPage />
            </AuthLayout>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthLayout title="Set a new password" subtitle="Choose a strong new password.">
              <ResetPasswordPage />
            </AuthLayout>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="*" element={<NotFoundPage />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Routes>
    </Loadable>
  );
}
