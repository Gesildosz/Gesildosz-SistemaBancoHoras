import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Cache para status de manutenção (evita consultas excessivas)
let maintenanceCache: { status: boolean; timestamp: number; message: string } | null = null
const CACHE_DURATION = 30000 // 30 segundos

async function isAuthenticatedAdmin(request: NextRequest): Promise<boolean> {
  try {
    // Verificar se tem cookie de sessão admin
    const adminSession = request.cookies.get("admin-session")
    if (!adminSession) return false

    // Verificar se a sessão é válida no banco
    const result = await sql`
      SELECT id FROM administradores 
      WHERE ativo = true 
      AND id = ${adminSession.value}
      LIMIT 1
    `

    return result.length > 0
  } catch (error) {
    console.error("[v0] Erro ao verificar admin:", error)
    return false
  }
}

async function getMaintenanceStatus(): Promise<{ ativo: boolean; mensagem: string }> {
  const now = Date.now()

  // Usar cache se ainda válido
  if (maintenanceCache && now - maintenanceCache.timestamp < CACHE_DURATION) {
    return { ativo: maintenanceCache.status, mensagem: maintenanceCache.message }
  }

  try {
    const result = await sql`
      SELECT ativo, mensagem 
      FROM manutencao_sistema 
      ORDER BY id DESC 
      LIMIT 1
    `

    const manutencao = result[0] || { ativo: false, mensagem: "Sistema em manutenção" }

    // Atualizar cache
    maintenanceCache = {
      status: manutencao.ativo,
      timestamp: now,
      message: manutencao.mensagem || "Sistema em manutenção",
    }

    return { ativo: manutencao.ativo, mensagem: manutencao.mensagem || "Sistema em manutenção" }
  } catch (error) {
    console.error("[v0] Erro no middleware de manutenção:", error)
    // Em caso de erro, assumir que não está em manutenção para não bloquear o sistema
    return { ativo: false, mensagem: "Sistema em manutenção" }
  }
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return NextResponse.next()
    }

    const { ativo: emManutencao, mensagem } = await getMaintenanceStatus()

    // Se sistema está em manutenção
    if (emManutencao) {
      const isAdmin = await isAuthenticatedAdmin(request)

      // Se for admin, permitir acesso normal
      if (isAdmin) {
        return NextResponse.next()
      }

      // Se não for admin e não estiver na página de manutenção, redirecionar
      if (!pathname.startsWith("/manutencao")) {
        const url = request.nextUrl.clone()
        url.pathname = "/manutencao"
        url.searchParams.set("mensagem", encodeURIComponent(mensagem))
        return NextResponse.redirect(url)
      }
    } else {
      // Se não está em manutenção mas está tentando acessar página de manutenção, redirecionar para home
      if (pathname.startsWith("/manutencao")) {
        const url = request.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[v0] Erro crítico no middleware:", error)
    // Em caso de erro crítico, permitir acesso para não quebrar o sistema
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
