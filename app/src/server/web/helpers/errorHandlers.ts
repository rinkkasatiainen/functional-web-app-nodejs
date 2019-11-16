import {ErrorRequestHandler, NextFunction, Request, RequestHandler, Response} from "express";

/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

type RequestResponse<T> = (x: Request, y: Response, z?: NextFunction) => Promise<T>;
export const catchErrors:
    (fn: RequestResponse<RequestHandler>) => RequestResponse<RequestHandler | void> =
    // function
    fn => {
        return (req: Request, res: Response, next?: NextFunction) => {
            return fn(req, res, next).catch(next);
        };
    };

// exports.catchErrors = (fn) => {
//   return function(req, res, next) {
//     return fn(req, res, next).catch(next);
//   };
// };

/*
  Not Found ErrorD Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
export const notFound: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const err: Error = new Error("Not Found!!!");
    err.status = 404;
    next(err);
};

// exports.notFound = (req, res, next) => {
//   const err = new ErrorD('Not Found');
//   err.status = 404;
//   next(err);
// };

/*
  MongoDB Validation ErrorD Handler

  Detect if there are mongodb validation errors that we can nicely show via flash messages
*/

// exports.flashValidationErrors = (err, req, res, next) => {
//   if (!err.errors) return next(err);
//   // validation errors look like
//   const errorKeys = Object.keys(err.errors);
//   // errorKeys.forEach(key => req.flash('error', err.errors[key].message));
//   res.redirect('back');
// };

/*
  Development ErrorD Hanlder

  In development we show good error messages so if we hit a syntax error or any
  other previously un-handled error, we can show good info on what happened
*/
export const developmentErrors: ErrorRequestHandler =
    (err: Error, req: Request, res: Response, next: NextFunction) => {
        err.stack = err.stack || "";
        const errorDetails = {
            message: err.message,
            stackHighlighted: err.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, "<mark>$&</mark>"),
            status: err.status,
        };
        res.status(err.status || 500);
        res.format({
            // Based on the `Accept` http header
            "application/json": () => res.json(errorDetails), // Ajax call, send JSON back
            "text/html": () => {
                res.render("error", errorDetails);
            }, // Form Submit, Reload the page
        });
    };

// exports.developmentErrors = (err, req, res, next) => {
//   err.stack = err.stack || '';
//   const errorDetails = {
//     message: err.message,
//     status: err.status,
//     stackHighlighted: err.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>')
//   };
//   res.status(err.status || 500);
//   res.format({
//     // Based on the `Accept` http header
//     'text/html': () => {
//       res.render('error', errorDetails);
//     }, // Form Submit, Reload the page
//     'application/json': () => res.json(errorDetails) // Ajax call, send JSON back
//   });
// };

/*
  Production ErrorD Handler

  No stacktraces are leaked to user
*/

export const productionErrors: ErrorRequestHandler =
    (err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500);
        res.render("error", {
            error: {},
            message: err.message,
        });
    };
// exports.productionErrors = (err, req, res, next) => {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// };
