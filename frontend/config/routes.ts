export enum ROUTES {
    LOGIN = "/login",
    DASHBOARD = "/dashboard",
    COLLECTIONS = "/collections",
    PROFILE = "/profile",
    HOME = "/",
}

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.HOME];

export const AUTH_ROUTES = [ROUTES.LOGIN];
