// pages/app/_middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  //const pathname = request.nextUrl.pathname;

  // Si no hay token y la ruta es bajo /app, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Verificar el token (usando tu clave secreta)
    const secret = process.env.JWT_SECRET || "my-super-secret-key";
    verify(token, secret); // Esto lanza una excepción si el token es inválido
    return NextResponse.next(); // Continuar si el token es válido
  } catch (error) {
    console.error("Token inválido:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/app/:path*"], // Aplica a todas las rutas bajo /app
};