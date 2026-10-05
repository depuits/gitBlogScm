const fs = require("node:fs/promises");
const { createHash } = require("node:crypto");
const Handlebars = require("handlebars");
const handlebarsHelpers = require("./handlebarsHelpers");
const { resolveOutputPath } = require("./pathUtils");

Handlebars.registerHelper(handlebarsHelpers);

async function generateOutput(repoPath, outputConfig, context) {
	const generatedFiles = [];

	for (const output of outputConfig.files) {
		const template = await loadTemplate(output);

		// Render the actual output content.
		const content = Handlebars.compile(template, { noEscape: true })(context);

		// Make the rendered content available as a hash for the filename.
		const hash = createHash("md5").update(content).digest("hex");

		const pathContext = {
			...context,
			hash,
		};

		const outputPath = Handlebars.compile(output.path, { noEscape: true })(
			pathContext,
		);
		const filePath = await resolveOutputPath(repoPath, outputPath);

		await fs.writeFile(filePath, content, "utf8");

		generatedFiles.push(filePath);
	}

	return generatedFiles;
}

async function loadTemplate(output) {
	if (output.template && output.templateFile) {
		throw new Error(
			"Output configuration cannot contain both template and templateFile.",
		);
	}

	if (!output.template && !output.templateFile) {
		throw new Error(
			"Output configuration requires either template or templateFile.",
		);
	}

	if (output.template) {
		return output.template;
	}

	return fs.readFile(output.templateFile, "utf8");
}

module.exports = generateOutput;
