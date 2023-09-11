import { logsFileName } from "./constants.js";
import * as fs from "fs";
export const writeLogs = (logs) => {
    console.log(logs);
    fs.appendFile(logsFileName, logs, (err) => {
        if (err)
            throw err;
    });
};
//# sourceMappingURL=helpers.js.map