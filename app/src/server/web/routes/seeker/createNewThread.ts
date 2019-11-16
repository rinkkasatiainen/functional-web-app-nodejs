import {NextFunction, Request, Response} from "express";
import {ActionToWebResponse} from "../../../domain/actions/action";
import {StreamId} from "../../../domain/actions/streamId";
export const GET = (req: Request, res: Response) => {
    res.render("hello_world");
};

export const POST = (req: Request, res: Response, next: NextFunction) => {
    res.render("index");
};

type NewGetStreamIdAction =
    (action: ActionToWebResponse<StreamId>) => ({}) => Either<Failure, Success<StreamId>>;

export const createNewThread: NewGetStreamIdAction =
    action => params => {
        return action();
    };
