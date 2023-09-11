import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
export const sheetPresets = sqliteTable("sheetPresets", {
    id: integer("id").primaryKey(),
    unitId: text("unitId"),
    noOfQuestions: text("noOfQuestions"),
    childOrder: text("childOrder"),
    correctAnswerScore: text("correctAnswerScore"),
    topicId: text("topicId"),
    wrongAnswerScore: text("wrongAnswerScore"),
    duration: text("duration"),
    totalScore: text("totalScore"),
    title: text("title"),
    passPercentage: text("passPercentage"),
    sheetName: text("sheetName"),
    createdDateTime: integer("createdDateTime", { mode: "timestamp" }).$default(() => sql `strftime('%s','now')`),
});
export const newSpreadSheet = sqliteTable("newSpreadSheet", {
    id: integer("id").primaryKey(),
    sheetId: text("sheetId"),
    sheetUrl: text("sheetUrl"),
    sheetPresetId: integer("sheetPresetId").references(() => sheetPresets.id),
});
export const sheetPresetsRelation = relations(sheetPresets, ({ one }) => ({
    spreadsheetDetails: one(newSpreadSheet, {
        fields: [sheetPresets.id],
        references: [newSpreadSheet.sheetPresetId],
    }),
}));
//# sourceMappingURL=schema.js.map