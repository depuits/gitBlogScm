const fs = require('fs');
const path = require('path');
const { createHash } = require('node:crypto');

module.exports = async function (fileCreateDest, req) {
	//1. validate input
	if (!req.file && !req.body.desc) {
		throw new Error('Image or description should be filed in.');
	}

	if (!req.body.collection || (typeof req.body.collection !== "string" && !Array.isArray(req.body.collection))) {
		throw new Error('No valid collection list provided.');
	}

	if (typeof req.body.collection === "string") {
		// convert the string to array for consistency
		req.body.collection = [ req.body.collection ];
	}

	if (!req.body.date) {
		throw new Error('No date provided.');		
	}
	
	//2. upload and create new files
	let md = '---\n';

	md += 'collection:\n';
	req.body.collection.forEach((item) => {
		md += `  - ${item}\n`;
	});

	if (req.file) {
		md += `image: "${req.file.filename}"\n`;
	}
	if (req.body.desc) {
		md += `desc: "${req.body.desc}"\n`;
	}

	let dateKey = 'date';
	if (req.body.sortDate) {
		dateKey = 'sortDate';
	}
	md += `${dateKey}: "${req.body.date}"\n`;

	md += '---\n\n';

	const hash = createHash('md5').update(md).digest('hex');
	let filePath = path.join(fileCreateDest, `${req.body.date}_${hash}.md`);
	await fs.promises.writeFile(filePath, md, 'utf8');

	let files = [ filePath ];
	if(req.file) {
		files.push(req.file.path);
	}

	return files;
};
