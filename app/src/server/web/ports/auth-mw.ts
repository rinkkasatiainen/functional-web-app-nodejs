import {NextFunction, Request, Response} from "express";
import {verify as verifyJWT} from "jsonwebtoken";
import S = require("sanctuary");
import {eitherToFuture} from "../../domain/actions/seeker/either-to-future";
import {secret} from "./secret";
import {JwtToken} from "./session/login";

export const authMW: (x: Auth.UserAccount) => (x: Request, y: Response, z: NextFunction) => void =
    userAccounts => async (req, res, next) => {

        const bearerToken = (req.header("Authorization") || "").replace("Bearer ", "");
        if (bearerToken === "") {
            next();
            return;
        }
        const verify: (x: {token: string, secretCode: string}) => JwtToken
            = ({token, secretCode}) => verifyJWT(token, secretCode) as JwtToken;
        const data = S.maybeToEither(null)( S.encase(verify)({token: bearerToken, secretCode: secret}) );

        const futureResult = eitherToFuture(data).chain( ({id}) => userAccounts.findById(id));

        await futureResult.promise()
            .then(resolve => {
                req.user = {userId: resolve.userId, username: resolve.username};
                next();
            })
            // If user is not authenticated, do not add user to request! Work as normal!
            .catch(err => next());
    };
