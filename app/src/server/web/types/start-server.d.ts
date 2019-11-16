import {Application, NextFunction, Request, RequestHandler, Response, Router} from "express";

export as namespace Server

interface Authenticate {
    readonly authenticate: () => RequestHandler;
    readonly login: (x: Request, y: Response, next: NextFunction) => void;
    readonly register: (req: Request, res: Response, next: NextFunction) => void;
}

export type AuthProvider = (a: Application) => Authenticate;
export type RoutesProvider = (a: Application) => (b: Authenticate) => Router;
export type ViewProvider = (a: Application) => void;
export interface EnvVariables {
    PORT: string;
    AUTH_POLICY: string;
    APPLICATION: string;
    PG_DATABASE: string;
    PG_PORT: number;
    PG_USER: string;
    PG_PASSWORD: string;
    PG_HOST: string;
}
