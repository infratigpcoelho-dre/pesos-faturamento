// Arquivo: src/components/app/CarregamentosPorDiaChart.tsx

"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

// Definimos o tipo de dado que nosso componente vai receber
type Lancamento = {
  data: string;
};

type CarregamentosPorDiaChartProps = {
  data: Lancamento[];
};

export function CarregamentosPorDiaChart({ data }: CarregamentosPorDiaChartProps) {
  // 1. Processamos os dados para contar quantos lançamentos por dia
  const dadosProcessados = data.reduce((acc, lancamento) => {
    // Usamos a data formatada como chave para o agrupamento
    const dataFormatada = new Date(lancamento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    
    // Se a data ainda não existe no nosso acumulador, iniciamos com 0
    if (!acc[dataFormatada]) {
      acc[dataFormatada] = 0;
    }
    
    // Incrementamos a contagem para aquela data
    acc[dataFormatada]++;
    
    return acc;
  }, {} as { [key: string]: number });

  // 2. Convertemos o objeto em um array que o gráfico entende e ordenamos por data
  const dadosParaGrafico = Object.keys(dadosProcessados)
    .map(data => ({
      data: data,
      carregamentos: dadosProcessados[data],
    }))
    .sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.data.split('/').reverse().join('-')).getTime();
      return dateA - dateB;
    });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={dadosParaGrafico}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="data"
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
          allowDecimals={false} // Não permite números quebrados no eixo Y
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
          labelStyle={{ color: '#f9fafb' }}
        />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Line 
          type="monotone" 
          dataKey="carregamentos" 
          stroke="#34d399" // Um verde vibrante
          strokeWidth={2}
          name="Nº de Carregamentos" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}