// Arquivo: src/app/admin/page.tsx (LINK 'PRODUTOS' ATIVADO)

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Boxes, Warehouse } from "lucide-react";
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
          <CardDescription>
            Bem-vindo, Mestre! Esta é a sua área de administração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Botão para Gerenciar Motoristas (o que você pediu) */}
            <Button asChild className="h-20 text-lg">
              <Link href="/admin/motoristas">
                <Users className="mr-2 h-5 w-5" /> Gerenciar Motoristas
              </Link>
            </Button>

            {/* 2. Botão para Gerenciar Produtos (AGORA ATIVO) */}
            <Button asChild className="h-20 text-lg">
              <Link href="/admin/produtos">
                <Boxes className="mr-2 h-5 w-5" /> Gerenciar Produtos
              </Link>
            </Button>

            {/* 3. Botão para Gerenciar Origens/Destinos (Sugestão) */}
            <Button asChild variant="outline" className="h-20 text-lg">
              <Link href="#"> {/* Deixamos o link '#' por enquanto */}
                <Warehouse className="mr-2 h-5 w-5" /> Gerenciar Origens (em breve)
              </Link>
            </Button>

          </div>
        </CardContent>
      </Card>
    </main>
  );
}