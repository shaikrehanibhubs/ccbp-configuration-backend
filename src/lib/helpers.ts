import { logsFileName } from "./constants.js";
import * as fs from "fs";

export const writeLogs = (logs: string) => {
  console.log(logs);
  fs.appendFile(logsFileName, logs, (err: any) => {
    if (err) throw err;
  });
};
