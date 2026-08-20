import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { QuickAddFab } from "@/components/layout/quick-add-fab";
import { QuickAddProvider } from "@/components/providers/quick-add-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "Usuário",
    email: session.user.email ?? "",
    image: session.user.image,
  };

  return (
    <QuickAddProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <Header user={user} />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </div>
      <MobileBottomNav />
      <QuickAddFab />
    </QuickAddProvider>
  );
}
