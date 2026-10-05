const fs = require("node:fs/promises");

async function cleanupFiles(files) {
	const uploadedFiles = Object.values(files || {}).flat();

	await Promise.all(
		uploadedFiles.map(async (file) => {
			try {
				await fs.unlink(file.path);
			} catch (error) {
				if (error.code !== "ENOENT") {
					throw error;
				}
			}
		}),
	);
}

module.exports = {
	cleanupFiles,
};
