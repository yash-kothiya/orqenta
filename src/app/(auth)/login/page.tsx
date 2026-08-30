import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.login;

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-muted px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Welcome to Orqenta</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
