// Arquivo: src/components/app/CarregamentosPorDiaChart.tsx (CORRIGIDO PARA DADOS NULOS)

"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type Lancamento = {
  data: string;
};

type CarregamentosPorDiaChartProps = {
  data: Lancamento[];
};

export function CarregamentosPorDiaChart({ data }: CarregamentosPorDiaChartProps) {
  const dadosProcessados = data.reduce((acc, lancamento) => {
    // CORREÇÃO AQUI: Garante que a data não é nula
    const dataFormatada = lancamento.data ? new Date(lancamento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem Data';
    
    if (!acc[dataFormatada]) {
      acc[dataFormatada] = 0;
    }
    acc[dataFormatada]++;
    return acc;
  }, {} as { [key: string]: number });

  const dadosParaGrafico = Object.keys(dadosProcessados)
    .map(data => ({
      data: data,
      carregamentos: dadosProcessados[data],
    }))
    .sort((a, b) => {
      // CORREÇÃO AQUI: Lida com "Sem Data" na ordenação
      if (a.data === 'Sem Data') return 1;
      if (b.data === 'Sem Data') return -1;
      // Garante que o formato da data 'dd/mm/aaaa' seja convertido para 'aaaa-mm-dd' para ordenação
      const dateA = new Date(a.data.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.data.split('/').reverse().join('-')).getTime();
      return dateA - dateB;
    });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={dadosParaGrafico}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="data" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
          labelStyle={{ color: '#f9fafb' }}
        />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Line 
          type="monotone" 
          dataKey="carregamentos" 
          stroke="#34d399" 
          strokeWidth={2}
          name="Nº de Carregamentos" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}