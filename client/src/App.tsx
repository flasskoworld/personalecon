import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PELanding from "./pages/PELanding";
import PEOnboarding from "./pages/PEOnboarding";
import PEDashboard from "./pages/PEDashboard";
import { loadState } from "./lib/peStore";

/**
 * Returns true if the user has completed onboarding with their own real plan
 * (not a demo). Read synchronously from localStorage so it always reflects
 * the latest persisted state.
 */
function hasPersonalPlan(): boolean {
  const state = loadState();
  return state.setupComplete === true && state.isDemo === false;
}

/**
 * Smart root redirect:
 * - User has a saved personal plan → go straight to their dashboard
 * - Otherwise → show the landing page
 */
function RootRedirect() {
  if (hasPersonalPlan()) {
    return <Redirect to="/pro/dashboard" />;
  }
  return <Redirect to="/pro" />;
}

/**
 * Smart /pro landing:
 * - User already has a plan → skip the landing page and go to dashboard
 * - Otherwise → render the landing page normally
 */
function ProLandingRoute() {
  if (hasPersonalPlan()) {
    return <Redirect to="/pro/dashboard" />;
  }
  return <PELanding />;
}

function Router() {
  return (
    <Switch>
      {/* Root: smart redirect based on whether the user has a saved plan */}
      <Route path={"/"} component={RootRedirect} />
      {/* /pro landing: skipped if user already has a personal plan */}
      <Route path={"/pro"} component={ProLandingRoute} />
      <Route path={"/pro/onboarding"} component={PEOnboarding} />
      <Route path={"/pro/dashboard"} component={PEDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
