// Arquivo: src/components/app/PesoPorMotoristaChart.tsx

"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const API_URL = 'https://api-pesos-faturamento.onrender.com';

type DadosPeso = {
  motorista: string;
  total_peso: number;
};

export function PesoPorMotoristaChart() {
  const [data, setData] = useState<DadosPeso[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const token = localStorage.getItem('authToken');
      if (!token) return; 

      try {
        const response = await fetch(`${API_URL}/api/analytics/peso-por-motorista`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do gráfico');
        }
        
        const dadosApi = await response.json();
        const dadosFormatados = dadosApi.map((item: any) => ({
          motorista: item.motorista,
          total_peso: Number(item.total_peso)
        }));
        setData(dadosFormatados);

      } catch (error) {
        toast.error("Erro ao carregar dados do gráfico de motoristas.");
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
          dataKey="motorista" 
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
          tickFormatter={(value) => `${value / 1000}t`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          formatter={(value: number) => [`${(value).toLocaleString('pt-BR')} kg`, 'Peso Total']}
        />
        <Bar dataKey="total_peso" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Peso Total" />
      </BarChart>
    </ResponsiveContainer>
  );
}