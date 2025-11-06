// Arquivo: src/app/admin/layout.tsx (O "SEGURANÇA" DA ÁREA MASTER)

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    // 1. Pega o nível de acesso que salvamos no login
    const role = localStorage.getItem('userRole');
    
    if (role === 'master') {
      // 2. Se for "master", permite o acesso
      setIsMaster(true);
    } else {
      // 3. Se NÃO for "master", nega o acesso e chuta para o dashboard principal
      toast.error("Acesso negado. Você não tem permissão de Master.");
      router.push('/');
    }
  }, [router]);

  // Enquanto verifica, não mostra nada
  if (!isMaster) {
    return <div className="flex h-screen items-center justify-center">Verificando permissões...</div>;
  }

  // Se a verificação passou, mostra o conteúdo da página de admin
  return (
    <div>
      {/* Aqui poderíamos adicionar um menu lateral de Admin no futuro */}
      {children}
    </div>
  );
}