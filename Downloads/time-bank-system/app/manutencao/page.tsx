"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Clock, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ManutencaoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mensagem, setMensagem] = useState("")
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const mensagemParam = searchParams.get("mensagem")
    if (mensagemParam) {
      setMensagem(decodeURIComponent(mensagemParam))
    } else {
      setMensagem("Sistema em manutenção. Tente novamente mais tarde.")
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          verificarStatus()
          return 30 // Reset countdown
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const verificarStatus = async () => {
    try {
      const response = await fetch("/api/sistema/status")
      const data = await response.json()

      if (data.success && !data.data.ativo) {
        router.push("/")
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent_50%)]" />

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center animate-pulse">
            <Settings className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Sistema em Manutenção</CardTitle>
            <p className="text-white/70 mt-2">Estamos trabalhando para melhorar sua experiência</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/90 text-sm leading-relaxed">{mensagem}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            <span>Próxima verificação em {countdown}s</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={verificarStatus}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 transition-all duration-200"
            >
              Verificar Status Agora
            </Button>

            <Button
              onClick={() => router.push("/admin/login")}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Shield className="w-4 w-4" />
              Acesso Administrativo
            </Button>
          </div>

          <div className="text-xs text-white/50 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Administradores têm acesso total durante a manutenção
            </p>
            <p>Em caso de urgência, entre em contato com o suporte técnico</p>
            <p>Agradecemos sua compreensão</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
