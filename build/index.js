import { google } from "googleapis";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import db from "./db/index.js";
import morgan from "morgan";
import { sheetPresets } from "./db/schema.js";
import { writeLogs } from "./lib/helpers.js";
import { desc, eq } from "drizzle-orm";
const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
dotenv.config();
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDENTIALS_FILE = process.env.CREDENTIALS_FILE;
const PORT = process.env.PORT;
const getAuth = async () => {
    const auth = await google.auth.getClient({
        keyFile: CREDENTIALS_FILE,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return auth;
};
const initializeSheets = async () => {
    const auth = await getAuth();
    return google.sheets({ version: "v4", auth });
};
const scriptDeploymentUrl = process.env.SCRIPT_DEPLOYMENT_URL;
const sheets = await initializeSheets();
const getRangeValues = async (cellId) => {
    const range = `Form!${cellId}`;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: range,
    });
    return response?.data?.values?.[0]?.[0];
};
const getFormValues = async () => {
    const unitIdValue = await getRangeValues("C5:C5");
    const noOfQuestionsValue = await getRangeValues("F5:F5");
    const childOrderValue = await getRangeValues("C7:C7");
    const correctAnswerScoreValue = await getRangeValues("F7:F7");
    const topicIdValue = await getRangeValues("C9:C9");
    const wrongAnswerScoreValue = await getRangeValues("F9:F9");
    const durationValue = await getRangeValues("C11:C11");
    const totalScoreValue = await getRangeValues("F11:F11");
    const titleValue = await getRangeValues("C13:C13");
    const passPercentageValue = await getRangeValues("F13:F13");
    const sheetNameValue = await getRangeValues("C15:C15");
    return {
        unitId: unitIdValue,
        noOfQuestions: noOfQuestionsValue,
        childOrder: childOrderValue,
        correctAnswerScore: correctAnswerScoreValue,
        topicId: topicIdValue,
        wrongAnswerScore: wrongAnswerScoreValue,
        duration: durationValue,
        totalScore: totalScoreValue,
        title: titleValue,
        passPercentage: passPercentageValue,
        sheetName: sheetNameValue,
    };
};
const callAppsScriptFunction = async () => {
    try {
        const res = await fetch(scriptDeploymentUrl, {
            method: "POST",
        });
        const jsonRes = await res.json();
        const stringifiedJsonRes = JSON.stringify(jsonRes);
        writeLogs(`Date: ${new Date().toLocaleString()}\nMethod: callAppsScriptFunction\nResponse: ${stringifiedJsonRes}`);
        if (jsonRes.status !== "Success") {
            throw new Error("Apps Script function call failed");
        }
        return jsonRes;
    }
    catch (err) {
        return { error: err.message };
    }
};
const updateFormValues = async (request) => {
    const rangeValues = [
        { range: "Form!C5", value: request.unitId },
        { range: "Form!F5", value: request.noOfQuestions },
        { range: "Form!C7", value: request.childOrder },
        { range: "Form!F7", value: request.correctAnswerScore },
        { range: "Form!C9", value: request.topicId },
        { range: "Form!F9", value: request.wrongAnswerScore },
        { range: "Form!C11", value: request.duration },
        { range: "Form!F11", value: request.totalScore },
        { range: "Form!C13", value: request.title },
        { range: "Form!F13", value: request.passPercentage },
        { range: "Form!C15", value: request.sheetName },
    ];
    try {
        const requests = rangeValues.map(({ range, value }) => ({
            range: range,
            values: [[value]],
        }));
        const batchUpdateRequest = {
            data: requests,
            valueInputOption: "RAW",
        };
        const response = await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: GOOGLE_SHEET_ID,
            requestBody: batchUpdateRequest,
        });
        const appScriptRes = await callAppsScriptFunction();
        return { response, appScriptRes };
    }
    catch (err) {
        console.error("The API returned an error:", err.message);
        return { error: err.message };
    }
};
app.post("/form", async (req, res) => {
    const request = req.body;
    try {
        const appScriptRes = (await updateFormValues(request)).appScriptRes;
        res.json({
            message: "Form values updated successfully",
            appScriptRes: appScriptRes.newSpreadSheet,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post("/save-in-db", async (req, res) => {
    try {
        const request = req.body;
        await db
            .insert(sheetPresets)
            .values({
            unitId: request.unitId,
            noOfQuestions: request.noOfQuestions,
            childOrder: request.childOrder,
            correctAnswerScore: request.correctAnswerScore,
            topicId: request.topicId,
            wrongAnswerScore: request.wrongAnswerScore,
            duration: request.duration,
            totalScore: request.totalScore,
            title: request.title,
            passPercentage: request.passPercentage,
            sheetName: request.sheetName,
        })
            .execute();
        return res.json({
            message: "Saved in DB",
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.put("/sheet-presets/:id", async (req, res) => {
    try {
        const request = req.body;
        const id = req.params.id;
        await db
            .update(sheetPresets)
            .set({
            unitId: request.unitId,
            noOfQuestions: request.noOfQuestions,
            childOrder: request.childOrder,
            correctAnswerScore: request.correctAnswerScore,
            topicId: request.topicId,
            wrongAnswerScore: request.wrongAnswerScore,
            duration: request.duration,
            totalScore: request.totalScore,
            title: request.title,
            passPercentage: request.passPercentage,
            sheetName: request.sheetName,
        })
            .where(eq(sheetPresets.id, id))
            .execute();
        return res.json({
            message: "Updated in DB",
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.get("/sheet-presets", async (req, res) => {
    try {
        const sheetPresetsValue = db
            .select()
            .from(sheetPresets)
            .orderBy(desc(sheetPresets.createdDateTime))
            .all();
        res.json({
            sheetPresets: sheetPresetsValue,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map