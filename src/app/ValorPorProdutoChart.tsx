// Arquivo: src/components/app/ValorPorProdutoChart.tsx

"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const API_URL = 'https://api-pesos-faturamento.onrender.com';

type DadosValor = {
  produto: string;
  total_valor: number;
};

export function ValorPorProdutoChart() {
  const [data, setData] = useState<DadosValor[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/analytics/valor-por-produto`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do gráfico');
        }
        
        const dadosApi = await response.json();
        const dadosFormatados = dadosApi.map((item: any) => ({
          produto: item.produto,
          total_valor: Number(item.total_valor)
        }));
        setData(dadosFormatados);

      } catch (error) {
        toast.error("Erro ao carregar dados do gráfico de produtos.");
        console.error(error);
      }
    }
    carregarDados();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
          tickFormatter={(value) => `R$ ${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          formatter={(value: number) => [
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 
            'Valor Total'
          ]}
        />
        <Bar dataKey="total_valor" fill="#10b981" radius={[4, 4, 0, 0]} name="Valor Total" />
      </BarChart>
    </ResponsiveContainer>
  );
}