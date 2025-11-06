// Arquivo: src/app/admin/page.tsx (A PÁGINA PRINCIPAL DO MASTER)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Painel de Controle Master</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bem-vindo, Mestre! Esta é a sua área de administração.</p>
          {/* Em breve, adicionaremos os links para as novas páginas aqui */}
          <div className="mt-4">
            <Button asChild>
              <Link href="/admin/motoristas">Gerenciar Motoristas</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}