const path = require("path");

const { normalizeValues, validateForm } = require("../lib/validateForm");
const generateOutput = require("../lib/generateOutput");
const { cleanupFiles } = require("../lib/cleanupFiles");

const createAsyncLock = require("../lib/asyncLock");

const lock = createAsyncLock();

function createContentService({ repoPath, config, contentPublisher }) {
	const output = config.get("content.output");
	const fields = config.get("content.fields");
	const validation = config.has("content.validation")
		? config.get("content.validation")
		: {};

	async function create(values, files) {
		const data = normalizeValues(fields, values, files);
		const errors = validateForm(fields, data, validation);

		if (Object.keys(errors).length > 0) {
			await cleanupFiles(files);
			return {
				success: false,
				data,
				errors,
			};
		}

		await lock.runExclusive(async () => {
			//update repo to make sure we have the latest version and no merge conflicts
			await contentPublisher.prepare();

			// create new files using content output the generate output
			let createdFiles = await generateOutput(repoPath, output, {
				data,
				fields,
			});

			// add uploaded files to created files
			const uploadedFiles = Object.values(files || {})
				.flat()
				.map((file) => file.path);

			createdFiles = [...createdFiles, ...uploadedFiles];

			// remove repo dir from createdFiles paths
			createdFiles = createdFiles.map((item) => path.relative(repoPath, item));

			const mfn = path.parse(createdFiles[0]).name;
			const commitMessage = `added item ${mfn}`;

			// public the changes
			await contentPublisher.publish(createdFiles, commitMessage);
		});

		return {
			success: true,
			data,
		};
	}

	return { create };
}

module.exports = { createContentService };
