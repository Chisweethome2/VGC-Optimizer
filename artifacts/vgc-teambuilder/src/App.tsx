import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "white", padding: "3rem", fontFamily: "sans-serif", minHeight: "100vh", background: "#111" }}>
          <h1 style={{ color: "#ef4444" }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px", marginTop: "1rem", color: "#aaa" }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import Dashboard from "@/pages/dashboard";
import Builder from "@/pages/builder";
import Analyze from "@/pages/analyze";
import Simulate from "@/pages/simulate";
import Archetypes from "@/pages/archetypes";
import Meta from "@/pages/meta";
import Login from "@/pages/login";
import Legends from "@/pages/legends";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/builder" component={Builder} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/simulate" component={Simulate} />
        <Route path="/archetypes" component={Archetypes} />
        <Route path="/meta" component={Meta} />
        <Route path="/login" component={Login} />
        <Route path="/legends" component={Legends} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
