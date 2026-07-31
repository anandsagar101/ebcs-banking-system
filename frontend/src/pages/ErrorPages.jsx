import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, ServerCrash, ShieldOff, SearchX } from "lucide-react";

function ErrorPage({ code, title, description, icon: Icon, testId }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" data-testid={testId}>
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Icon className="h-10 w-10" />
        </div>
        <div className="text-6xl font-bold tracking-tighter">{code}</div>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <Button asChild><Link to="/"><Home className="h-4 w-4 mr-2" />Home</Link></Button>
        </div>
      </div>
    </div>
  );
}

export const NotFound = () => (
  <ErrorPage code="404" title="Page not found" icon={SearchX}
    description="The page you're looking for doesn't exist or has been moved." testId="page-404" />
);
export const Forbidden = () => (
  <ErrorPage code="403" title="Access denied" icon={ShieldOff}
    description="You don't have permission to view this resource. Contact your administrator." testId="page-403" />
);
export const ServerError = () => (
  <ErrorPage code="500" title="Something went wrong" icon={ServerCrash}
    description="An unexpected error occurred. Please try again in a moment." testId="page-500" />
);
