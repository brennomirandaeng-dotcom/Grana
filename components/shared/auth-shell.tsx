import { Logo } from "@/components/shared/logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-1 bg-surface-muted">
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-brand text-brand-foreground p-12">
        <Logo className="h-9 w-28" />
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Toda a sua vida financeira, em um único lugar.</h1>
          <p className="text-brand-foreground/70">
            Controle receitas, despesas, cartões, investimentos e patrimônio com clareza — e descubra para onde seu
            dinheiro está indo.
          </p>
        </div>
        <p className="text-xs text-brand-foreground/50">© {new Date().getFullYear()} Finanças. Todos os direitos reservados.</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
