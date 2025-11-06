// Arquivo: src/app/admin/page.tsx (LINK ATUALIZADO)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react"; // Adicionamos ícone
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
          <div className="mt-4">
            {/* AGORA O LINK FUNCIONA */}
            <Button asChild>
              <Link href="/admin/motoristas">
                <Users className="mr-2 h-4 w-4" /> Gerenciar Motoristas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}