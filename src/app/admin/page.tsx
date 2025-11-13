// Arquivo: src/app/admin/page.tsx (LINKS CORRIGIDOS)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Boxes, Warehouse, MapPin } from "lucide-react"; // Adicionei MapPin
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
          <CardDescription>Bem-vindo, Mestre! Selecione uma opção abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Motoristas */}
            <Button asChild className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/motoristas">
                <Users className="h-6 w-6" /> Motoristas
              </Link>
            </Button>

            {/* 2. Produtos */}
            <Button asChild variant="outline" className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/produtos">
                <Boxes className="h-6 w-6" /> Produtos
              </Link>
            </Button>

            {/* 3. Origens (AGORA FUNCIONA) */}
            <Button asChild variant="outline" className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/origens">
                <Warehouse className="h-6 w-6" /> Origens
              </Link>
            </Button>

            {/* 4. Destinos (NOVO) */}
            <Button asChild variant="outline" className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/destinos">
                <MapPin className="h-6 w-6" /> Destinos
              </Link>
            </Button>

          </div>
        </CardContent>
      </Card>
    </main>
  );
}