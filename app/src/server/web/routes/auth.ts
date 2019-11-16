import {NextFunction, Request, Response, Router} from "express";
// @ts-ignore - do this to add validator functions to request, for TSC!!!
import expressValidator = require("express-validator");

import {logErrors} from "./helpers/debug-errors";
import {debugLogForDev} from "./mapper/session_based_mappings";
import {createNewMessageThread} from "./seeker";

const logEntry: (x: Request, y: Response, z: NextFunction) => void =
    (req, res, next) => {
        debugLogForDev({req, res})({entry: {params: req.params, body: req.body}});
        next();
    };

function onRegisterError(errors: Array<{msg: string}>, req: Request, res: Response) {
    logErrors("ERRORR", {errors});
    errors.forEach(error => {
        req.flash("error", error.msg);
    });
    res.redirect(req.originalUrl);
}

const validateRegister: (x: Request, z: Response, y: NextFunction) => void =
    (req, res, next) => {
        // TODO: AkS: Create and test a sanitizer that checks a valid username - trim() + whitespacesToPlus, etc.
        req.sanitizeBody("username");
        req.checkBody("username", "You must supply a name!").notEmpty();
        // if (req.body.email !== "") {
        //     req.checkBody("email", "That Email is not valid!").isEmail();
        //     req.sanitizeBody("email").normalizeEmail({
        //         gmail_remove_dots: false,
        //         gmail_remove_subaddress: false,
        //     });
        // }
        req.checkBody("password", "Salasana ei voi olla tyhjä").notEmpty();
        req.checkBody("password", "Salasana on oltava yli 8 merkkiä pitkä").isLength({min: 8});
        req.checkBody("password-confirm", "Salasana ei voi olla tyhjä!").notEmpty();
        req.checkBody("password-confirm", "Ups! Salasanasi eivät olleet yhteneviä").equals(req.body.password);

        const errors = req.validationErrors() as Array<{msg: string}>;
        if (errors) {
            // TODO: Show somehow errors!
            onRegisterError(errors, req, res);
            return; // stop the fn from running
        }
        next(); // there were no errors!
    };

// routes r: Router, a: Auth => r -> a -> r
export const authRoutes: (x: Server.Authenticate) =>  (x: Adapters) => Router =
    (auth) => ({uuidProvider, limit})  => {
        const router = Router();
        router.get(`/login`, (req: Request, res: Response) => {
            res.render("auth/login", {title: "Login"});
        });
        //
        // router.get(`/register/:uuid`, (req: Request, res: Response) => {
        //     res.render("seeker/register", { uuid: req.params.uuid });
        // });
        router.post(`/login`, (req, res) => {
            const next: NextFunction = err => {
                req.flash("unauthorized", "Käyttäjänimi ja salasana virheellinen!");
                res.redirect("/");
            };
            auth.login(req, res, next);
        });

        router.get(`/logout`, (req, res, next) => {
            req.logout();
            req.flash("success", "You are now logged out! 👋");
            res.redirect("/");
        });

        router.get("/register",
            createNewMessageThread({limit, uuidProvider}),
        );
        router.get("/register/:uuid",
            ((req, res) => res.render("seeker/register", {uuid: req.params.uuid})),
        );
        router.post(`/register/:uuid`,
            logEntry,
            validateRegister,
            auth.register,
            auth.login,
        );

        return router;
    };
