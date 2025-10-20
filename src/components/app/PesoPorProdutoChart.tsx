// Arquivo: src/components/app/PesoPorProdutoChart.tsx (CORRIGIDO)

"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// 1. ALTERAÇÃO: O tipo de dado agora usa 'pesoReal'
type Lancamento = {
  produto: string;
  pesoReal: number;
};

type PesoPorProdutoChartProps = {
  data: Lancamento[];
};

export function PesoPorProdutoChart({ data }: PesoPorProdutoChartProps) {
  // 2. ALTERAÇÃO: A lógica agora SOMA o 'pesoReal' por produto
  const dadosProcessados = data.reduce((acc, lancamento) => {
    const produto = lancamento.produto || "Não especificado";
    const peso = Number(lancamento.pesoReal) || 0;
    
    const produtoExistente = acc.find(item => item.produto === produto);

    if (produtoExistente) {
      produtoExistente.pesoTotal += peso;
    } else {
      acc.push({
        produto: produto,
        pesoTotal: peso,
      });
    }
    return acc;
  }, [] as { produto: string; pesoTotal: number }[]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={dadosProcessados}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="produto"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}t`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          formatter={(value: number) => [`${(value / 1000).toLocaleString('pt-BR')} t`, 'Peso Total']}
        />
        {/* 3. ALTERAÇÃO: O 'dataKey' agora é 'pesoTotal' */}
        <Bar dataKey="pesoTotal" fill="#8884d8" radius={[4, 4, 0, 0]} name="Peso Total" />
      </BarChart>
    </ResponsiveContainer>
  );
}