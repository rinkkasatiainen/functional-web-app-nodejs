import {NextFunction, Request, Response, Router} from "express";

export const userRoutes: (y: Router) => Router =
    (router) => {
        router.get(`/user`, (req, res) => {
            res.send("respond with a resource");
        });

        router.get(`/user/profile`, (req: Request, res: Response, next: NextFunction) => {
            res.json(req.user);
        });

        return router;
    };
