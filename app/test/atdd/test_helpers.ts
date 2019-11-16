
export const logTestStep: (testName: string) => (message: string) => void =
    testName => {
        console.log("!!!!!")
        console.log("Start testing on")
        console.log(`--${testName}--`)
        return message => {
                console.log(`  ${message}`);
        }
    }
