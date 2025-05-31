import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {auth} from "@/auth";

export const publicRoutes = ["/login"];
export const authRoutes = ["/login"];
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const {pathname} = request.nextUrl;

    const isAuthRoute = authRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }

    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};