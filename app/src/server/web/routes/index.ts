import {NextFunction, Request, Response} from "express";

export const indexRoute = (req: Request, res: Response, next: NextFunction) => {
  res.render("index");
};
