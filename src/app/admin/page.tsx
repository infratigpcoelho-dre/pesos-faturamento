// Arquivo: src/app/admin/page.tsx (ATUALIZADO COM OS NOVOS GRÁFICOS)

"use client"; // Necessário para usar os componentes de gráfico

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Boxes, Warehouse, MapPin, BarChart2 } from "lucide-react";
import Link from "next/link";
import { PesoPorMotoristaChart } from "@/components/app/PesoPorMotoristaChart"; // 1. IMPORTAMOS O GRÁFICO
import { ValorPorProdutoChart } from "@/components/app/ValorPorProdutoChart"; // 2. IMPORTAMOS O GRÁFICO

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

      {/* SEÇÃO DE GRÁFICOS DE ANÁLISE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Análise de Performance
          </CardTitle>
          <CardDescription>
            Resumo do desempenho de motoristas e lucratividade de produtos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Peso Total por Motorista</CardTitle>
            </CardHeader>
            <CardContent>
              <PesoPorMotoristaChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Valor Total por Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ValorPorProdutoChart />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* SEÇÃO DE GERENCIAMENTO (OS BOTÕES) */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento do Sistema</CardTitle>
          <CardDescription>
            Adicione ou edite os dados mestres do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/motoristas">
                <Users className="h-6 w-6" /> Motoristas
              </Link>
            </Button>
            <Button asChild className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/produtos">
                <Boxes className="h-6 w-6" /> Produtos
              </Link>
            </Button>
            <Button asChild className="h-24 text-lg flex flex-col items-center justify-center gap-2">
              <Link href="/admin/origens">
                <Warehouse className="h-6 w-6" /> Origens
              </Link>
            </Button>
            <Button asChild className="h-24 text-lg flex flex-col items-center justify-center gap-2">
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