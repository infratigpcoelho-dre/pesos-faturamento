"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DadosGrafico {
  motorista: string;
  total_peso: number;
}

// URL Inteligente para os Gráficos
const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? 'http://localhost:3001' 
    : ''; // Na Vercel, o rewrites redireciona /api automaticamente

export function PesoPorMotoristaChart() {
  const [data, setData] = useState<DadosGrafico[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/analytics/peso-por-motorista`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Erro ao carregar gráfico de peso:", error);
      }
    };
    carregarDados();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="motorista" />
        <YAxis />
        <Tooltip formatter={(value: number) => `${value.toLocaleString()} Ton`} />
        <Bar dataKey="total_peso" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}