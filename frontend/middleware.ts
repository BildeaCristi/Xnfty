import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {auth} from "@/auth";
import { AUTH_ROUTES, PUBLIC_ROUTES, ROUTES } from "./config/routes";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const {pathname} = request.nextUrl;

    const isAuthRoute = AUTH_ROUTES.includes(pathname as ROUTES);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname as ROUTES);

    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};