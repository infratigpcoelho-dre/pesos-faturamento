"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DadosGrafico {
  produto: string;
  total_valor: number;
}

// URL Inteligente para os Gráficos
const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? 'http://localhost:3001' 
    : ''; 

export function ValorPorProdutoChart() {
  const [data, setData] = useState<DadosGrafico[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/analytics/valor-por-produto`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Erro ao carregar gráfico de valor:", error);
      }
    };
    carregarDados();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="produto" />
        <YAxis />
        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString()}`} />
        <Bar dataKey="total_valor" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}