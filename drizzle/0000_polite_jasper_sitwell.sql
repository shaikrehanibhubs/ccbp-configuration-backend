CREATE TABLE `sheetPresets` (
	`id` integer PRIMARY KEY NOT NULL,
	`noOfQuestions` text,
	`noOfOptions` text,
	`childOrder` text,
	`correctAnswerScore` text,
	`topicId` text,
	`wrongAnswerScore` text,
	`duration` text,
	`totalScore` text,
	`title` text,
	`passPercentage` text,
	`sheetName` text
);
