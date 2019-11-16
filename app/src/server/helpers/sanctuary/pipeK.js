"use strict";

const S = require("sanctuary");
//pipeK(restFuns)(eitherSomething);
const pipeK = funcs => input => S.pipeK(funcs)(input)

module.exports = pipeK;
