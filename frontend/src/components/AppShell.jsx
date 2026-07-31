import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <Breadcrumbs />
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0" data-testid="app-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
