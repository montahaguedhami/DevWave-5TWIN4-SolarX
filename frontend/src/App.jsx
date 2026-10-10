import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/Themeprovider";
import { NotesProvider } from "@/context/notes-context";
import { BlogProvider } from "@/context/blog-context";
import { TicketProvider } from "@/context/ticket-context";
import { OfflineBanner } from "@/components/shared/offline-banner";
import Layout from "@/pages/layout";
import DashboardPage from "@/pages/page";
import SolarProductionPage from "@/pages/solar-production/page";
import SolarSimulatorPage from "@/pages/solar-simulator/page";
import BatteryPage from "@/pages/battery/page";
import ConsumptionPage from "@/pages/consumption/page";
import SavingsPage from "@/pages/savings/page";
import EnvironmentalImpactPage from "@/pages/environmental-impact/page";
import AiAdvisorPage from "@/pages/ai-advisor/page";
import MyInstallationPage from "@/pages/my-installation/page";
import AlertsPage from "@/pages/alerts/page";
import AnalyticsPage from "@/pages/analytics/page";
import SettingsPage from "@/pages/settings/page";
import NotesAppPage from "@/pages/apps/notes/page";
import TicketsAppPage from "@/pages/apps/tickets/page";
import CreateTicketPage from "@/pages/apps/tickets/create/page";
import BlogPostPage from "@/pages/apps/blog/post/page";
import BlogDetailPage from "@/pages/apps/blog/detail/[slug]/page";
import BlogCreatePage from "@/pages/apps/blog/create/page";
import BlogEditPage from "@/pages/apps/blog/edit/page";
import BlogManagePage from "@/pages/apps/blog/manage-blog/page";
import IconifyPage from "@/pages/icons/iconify/page";
import FooterPage from "@/pages/layout/footer/page";
import BuyNowPage from "@/pages/layout/vertical/sidebar/buy-now/page";
import FormPage from "@/pages/pages/form/page";
import TablesPage from "@/pages/pages/tables/page";
import UserProfilePage from "@/pages/pages/user-profile/page";
import LoginPage from "@/pages/auth/auth2/login/page";
import RegisterPage from "@/pages/auth/auth2/register/page";
import ForgotPasswordPage from "@/pages/auth/auth2/forgot-password/page";
import TwoStepsPage from "@/pages/auth/auth2/two-steps/page";
import MaintenancePage from "@/pages/auth/maintenance/page";
import AuthErrorPage from "@/pages/auth/error/page";
import NotFoundPage from "@/pages/not-found";
function App() {
  return <ThemeProvider>
      <NotesProvider>
        <BlogProvider>
          <TicketProvider>
            <BrowserRouter>
              <Routes>
                {
    /* Main Layout Routes */
  }
                <Route path="/" element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="solar-production" element={<SolarProductionPage />} />
                  <Route path="solar-simulator" element={<SolarSimulatorPage />} />
                  <Route path="battery" element={<BatteryPage />} />
                  <Route path="consumption" element={<ConsumptionPage />} />
                  <Route path="savings" element={<SavingsPage />} />
                  <Route path="environmental-impact" element={<EnvironmentalImpactPage />} />
                  <Route path="ai-advisor" element={<AiAdvisorPage />} />
                  <Route path="my-installation" element={<MyInstallationPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  <Route path="apps/notes" element={<NotesAppPage />} />
                  <Route path="apps/tickets" element={<TicketsAppPage />} />
                  <Route path="apps/tickets/create" element={<CreateTicketPage />} />
                  <Route path="apps/blog/post" element={<BlogPostPage />} />
                  <Route path="apps/blog/detail/:slug" element={<BlogDetailPage />} />
                  <Route path="apps/blog/create" element={<BlogCreatePage />} />
                  <Route path="apps/blog/edit" element={<BlogEditPage />} />
                  <Route path="apps/blog/manage-blog" element={<BlogManagePage />} />

                  <Route path="icons/iconify" element={<IconifyPage />} />
                  <Route path="layout/footer" element={<FooterPage />} />
                  <Route path="layout/vertical/sidebar/buy-now" element={<BuyNowPage />} />
                  <Route path="pages/form" element={<FormPage />} />
                  <Route path="pages/tables" element={<TablesPage />} />
                  <Route path="pages/user-profile" element={<UserProfilePage />} />
                </Route>

                {
    /* Auth Routes */
  }
                <Route path="/auth/auth2/login" element={<LoginPage />} />
                <Route path="/auth/auth2/register" element={<RegisterPage />} />
                <Route path="/auth/auth2/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/auth2/two-steps" element={<TwoStepsPage />} />
                <Route path="/auth/maintenance" element={<MaintenancePage />} />
                <Route path="/auth/error" element={<AuthErrorPage />} />

                {
    /* Catch All 404 Route */
  }
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <OfflineBanner />
            </BrowserRouter>
          </TicketProvider>
        </BlogProvider>
      </NotesProvider>
    </ThemeProvider>;
}
export {
  App as default
};
