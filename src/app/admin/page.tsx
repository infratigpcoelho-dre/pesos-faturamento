"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Boxes, Warehouse, MapPin, BarChart2 } from "lucide-react";
import Link from "next/link";
import { PesoPorMotoristaChart } from "@/components/app/PesoPorMotoristaChart";
import { ValorPorProdutoChart } from "@/components/app/ValorPorProdutoChart";

export default function AdminDashboard() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* CABEÇALHO COM BOTÃO VOLTAR */}
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
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart2 className="h-5 w-5" />
            Análise de Performance
          </CardTitle>
          <CardDescription>
            Resumo em tempo real do desempenho de motoristas e lucratividade.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {/* GRÁFICO 1 */}
          <Card className="bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold text-slate-700">Peso Total por Motorista (Ton)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <PesoPorMotoristaChart />
              </div>
            </CardContent>
          </Card>

          {/* GRÁFICO 2 */}
          <Card className="bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold text-slate-700">Faturamento Total por Produto (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ValorPorProdutoChart />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* SEÇÃO DE GERENCIAMENTO (BOTÕES DE ACESSO) */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados Mestres</CardTitle>
          <CardDescription>
            Configure as opções que aparecem nos formulários para os motoristas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* BOTÃO MOTORISTAS */}
            <Button asChild variant="outline" className="h-28 text-lg flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
              <Link href="/admin/motoristas">
                <Users className="h-7 w-7" /> 
                <span>Motoristas</span>
              </Link>
            </Button>

            {/* BOTÃO PRODUTOS */}
            <Button asChild variant="outline" className="h-28 text-lg flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
              <Link href="/admin/produtos">
                <Boxes className="h-7 w-7" /> 
                <span>Produtos</span>
              </Link>
            </Button>

            {/* BOTÃO ORIGENS */}
            <Button asChild variant="outline" className="h-28 text-lg flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
              <Link href="/admin/origens">
                <Warehouse className="h-7 w-7" /> 
                <span>Origens</span>
              </Link>
            </Button>

            {/* BOTÃO DESTINOS */}
            <Button asChild variant="outline" className="h-28 text-lg flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
              <Link href="/admin/destinos">
                <MapPin className="h-7 w-7" /> 
                <span>Destinos</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}