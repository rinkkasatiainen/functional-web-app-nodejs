"use strict";

const S = require("sanctuary");
const pipe = funcs => input => S.pipe(funcs)(input)

module.exports = pipe;
