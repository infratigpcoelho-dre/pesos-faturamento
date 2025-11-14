// Arquivo: src/components/app/PesoPorProdutoChart.tsx (COMPLETO E CORRIGIDO PARA 'Ton')

"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Lancamento = {
  produto: string;
  pesoreal: number; // USA O NOME MINÚSCULO DO BANCO
};

type PesoPorProdutoChartProps = {
  data: Lancamento[];
};

export function PesoPorProdutoChart({ data }: PesoPorProdutoChartProps) {
  const dadosProcessados = data.reduce((acc, lancamento) => {
    const produto = lancamento.produto || "Não especificado";
    const peso = Number(lancamento.pesoreal) || 0; // O peso já está em Toneladas
    
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
          interval={0} 
          angle={-30} 
          textAnchor="end" 
          height={70} 
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          // ****** MUDANÇA AQUI (removemos / 1000) ******
          tickFormatter={(value) => `${value} t`} 
        />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          // ****** MUDANÇA AQUI (removemos / 1000) ******
          formatter={(value: number) => [`${(value).toLocaleString('pt-BR')} t`, 'Peso Total']}
        />
        <Bar dataKey="pesoTotal" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Peso Total" />
      </BarChart>
    </ResponsiveContainer>
  );
}