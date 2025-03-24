// pages/_middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Si la ruta es pública (ej. /login o /), no redirigir
  if (["/", "/login"].includes(pathname)) {
    return NextResponse.next();
  }

  // Si no hay token y la ruta es bajo /app, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const secret = process.env.JWT_SECRET || "my-super-secret-key";
    verify(token, secret);
    return NextResponse.next();
  } catch (error) {
    console.error("Token inválido:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/app/:path*"],
};