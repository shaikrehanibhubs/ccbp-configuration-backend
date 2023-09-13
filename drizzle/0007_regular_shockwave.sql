CREATE TABLE `newSpreadSheet` (
	`id` integer PRIMARY KEY NOT NULL,
	`sheetId` text,
	`sheetUrl` text,
	`sheetPresetId` integer,
	FOREIGN KEY (`sheetPresetId`) REFERENCES `sheetPresets`(`id`) ON UPDATE no action ON DELETE no action
);
