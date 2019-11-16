export const reportErrors: ReqRes<HandleError> =
    ({res}) => {
        return (error: Failure): void => {
            const reason = error.type || "internal";
            res.sendStatus(errorToCode(reason));
            res.json(error);
        };
    };

interface CodeToNumber {
    [name: string]: number;
}

const errorToCode: (x: DomainErrorsTypes) => number =
    code => {
        const codes: CodeToNumber = {forbidden: 403};
        return Object.keys(codes).includes( code ) ? codes[code] : 500;
    };
