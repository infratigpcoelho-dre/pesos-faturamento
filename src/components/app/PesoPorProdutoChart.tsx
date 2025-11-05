// Arquivo: src/components/app/PesoPorProdutoChart.tsx (CORRIGIDO PARA DADOS NULOS)

"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Lancamento = {
  produto: string;
  pesoreal: number;
};

type PesoPorProdutoChartProps = {
  data: Lancamento[];
};

export function PesoPorProdutoChart({ data }: PesoPorProdutoChartProps) {
  const dadosProcessados = data.reduce((acc, lancamento) => {
    const produto = lancamento.produto || "Não especificado";
    const peso = Number(lancamento.pesoreal) || 0;
    
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
        <XAxis dataKey="produto" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}t`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          formatter={(value: unknown) => {
            const valorNumerico = Number(value) || 0;
            return [`${(valorNumerico / 1000).toLocaleString('pt-BR')} t`, 'Peso Total'];
          }}
        />
        <Bar dataKey="pesoTotal" fill="#8884d8" radius={[4, 4, 0, 0]} name="Peso Total" />
      </BarChart>
    </ResponsiveContainer>
  );
}