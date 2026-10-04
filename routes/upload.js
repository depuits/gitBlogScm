const multer  = require('multer');
const crypto = require('node:crypto');
const path = require('path');

const { resolveDirectoryPath } = require('../lib/pathUtils');

async function createUpload({ repoPath, config }) {

	const fileFieldConfigs = config
		.get('content.fields')
		.filter(field => field.type === 'file');

	const uploadDestinations = new Map();

	for (const field of fileFieldConfigs) {
		const destination = await resolveDirectoryPath(repoPath, field.destination)
		uploadDestinations.set(field.name, destination);
	}

	// multer file upload setup
	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			const destination = uploadDestinations.get(file.fieldname);

			if (!destination) {
				return cb(new Error(`Unexpected file field: ${file.fieldname}`));
			}

			cb(null, destination);
		},
		filename: (req, file, cb) => {
			crypto.randomBytes(16, function (err, raw) {
				if (err) return cb(err);

				cb(null, raw.toString('hex') + path.extname(file.originalname).toLowerCase()); //fix for missing extension files
			});
		},
	});
	const upload = multer({ storage: storage });

	const fileFields = fileFieldConfigs.map(field => ({
		name: field.name,
		maxCount: field.multiple ? 100 : 1,
	}));

	return {
		upload, 
		fileFields,
		middleware: upload.fields(fileFields),
	};
}

module.exports = { createUpload };
