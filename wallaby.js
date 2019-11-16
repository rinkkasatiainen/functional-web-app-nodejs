module.exports = function () {
    return {
        files: [
            'app/src/server/**/*.js',
            'app/src/server/**/*.ts',
            '!app/src/server/**/*.spec.ts',
            'app/src/test-helpers/*helpers.ts',
            'app/src/test-helpers/test-data.ts',
        ],
        tests: [
            'app/src/server/**/*.spec.ts',
        ],
        testFramework: "mocha",
        env: { type: 'node' }
    };
};
