"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Settings, AlertTriangle, CheckCircle, Clock, Users, Shield, Eye, EyeOff } from "lucide-react"

interface StatusManutencao {
  ativo: boolean
  mensagem: string
  data_inicio?: string
  data_fim?: string
  atualizado_em?: string
}

export default function ManutencaoControls() {
  const [status, setStatus] = useState<StatusManutencao>({
    ativo: false,
    mensagem: "Sistema em manutenção. Tente novamente mais tarde.",
  })
  const [novaMensagem, setNovaMensagem] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [previewMode, setPreviewMode] = useState(false)

  const carregarStatus = async () => {
    try {
      const response = await fetch("/api/admin/manutencao")
      const data = await response.json()

      if (data.success) {
        setStatus(data.data)
        setNovaMensagem(data.data.mensagem || "")
      } else {
        setError("Erro ao carregar status de manutenção")
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    }
  }

  const alterarStatus = async (novoStatus: boolean) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/manutencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativo: novoStatus,
          mensagem: novaMensagem || "Sistema em manutenção. Tente novamente mais tarde.",
          criadoPor: "ADMIN",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        await carregarStatus()
      } else {
        setError(data.error || "Erro ao alterar status")
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    carregarStatus()
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-400/30 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-100">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-400/30 backdrop-blur-sm">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-100">{success}</AlertDescription>
        </Alert>
      )}

      {/* Status Atual */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status Atual do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.ativo ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
              <span className="text-white font-medium">
                {status.ativo ? "Sistema em Manutenção" : "Sistema Operacional"}
              </span>
            </div>
            <Badge
              variant={status.ativo ? "destructive" : "default"}
              className={
                status.ativo
                  ? "bg-red-500/20 text-red-200 border-red-400/30"
                  : "bg-green-500/20 text-green-200 border-green-400/30"
              }
            >
              {status.ativo ? "MANUTENÇÃO" : "ATIVO"}
            </Badge>
          </div>

          {status.ativo && (
            <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
              <p className="text-red-200 text-sm font-medium mb-1">Mensagem atual:</p>
              <p className="text-red-100 text-sm">{status.mensagem}</p>
            </div>
          )}

          {status.atualizado_em && (
            <div className="text-xs text-white/60 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última atualização: {formatarData(status.atualizado_em)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de Manutenção */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controles de Manutenção
          </CardTitle>
          <CardDescription className="text-white/70">Configure o modo de manutenção do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mensagem Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="mensagem" className="text-sm font-medium text-white">
              Mensagem de Manutenção
            </Label>
            <Textarea
              id="mensagem"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite a mensagem que será exibida aos colaboradores..."
              className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
            />
            <p className="text-xs text-white/60">
              Esta mensagem será exibida na tela de manutenção para os colaboradores
            </p>
          </div>

          {/* Preview da Mensagem */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {previewMode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {previewMode ? "Ocultar" : "Visualizar"} Preview
              </Button>
            </div>

            {previewMode && (
              <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-400/20 rounded-lg p-4">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Sistema em Manutenção</h3>
                    <p className="text-white/70 text-sm mt-1">Estamos trabalhando para melhorar sua experiência</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                    <p className="text-white/90 text-sm">
                      {novaMensagem || "Sistema em manutenção. Tente novamente mais tarde."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => alterarStatus(true)}
              disabled={loading || status.ativo}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Ativando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Ativar Manutenção
                </div>
              )}
            </Button>

            <Button
              onClick={() => alterarStatus(false)}
              disabled={loading || !status.ativo}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Desativando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Desativar Manutenção
                </div>
              )}
            </Button>
          </div>

          {/* Informações Importantes */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Informações Importantes
            </h4>
            <div className="text-xs text-blue-200/80 space-y-1">
              <p>
                • <strong>Administradores:</strong> Continuam com acesso total ao sistema (verificação por sessão)
              </p>
              <p>
                • <strong>Colaboradores:</strong> Serão redirecionados para a tela de manutenção automaticamente
              </p>
              <p>
                • <strong>APIs:</strong> Continuam funcionando normalmente para operações críticas
              </p>
              <p>
                • <strong>Cache:</strong> Status verificado a cada 30 segundos para otimizar performance
              </p>
              <p>
                • <strong>Logs:</strong> Todas as ações são registradas no sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
