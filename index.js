const express = require('express');
const multer  = require('multer');
const crypto = require('node:crypto');
const Handlebars = require('handlebars');
const { engine } = require('express-handlebars');

const path = require('path');
const config = require('config');

const handlebarsHelpers = require('./lib/handlebarsHelpers');
const { normalizeValues, validateForm } = require('./lib/validateForm');
const generateOutput = require('./lib/generateOutput');
const cleanupFiles = require('./lib/cleanupFiles');
const { resolveDirectoryPath } = require('./lib/pathUtils');

const { createGitRepository } = require('./lib/git');
const GitContentPublisher = require('./lib/contentPublishers/gitContentPublisher');
const ConsoleContentPublisher = require('./lib/contentPublishers/consoleContentPublisher');

const devMode =
	process.argv.includes('--dev') ||
	process.argv.includes('--test');

const gitConfig = {
	...config.get('git'),
	path: path.resolve(config.get('git.path')),
};

const viewConfig = {
	app: config.get('app'),
	ui: config.get('ui'),
	content: {
		fields: config.get('content.fields'),
	},
};

async function setupApp() {
	let contentPublisher;
	if (devMode) { 
		console.log('Running in development/test mode - Git actions disabled.');
		contentPublisher = new ConsoleContentPublisher();
	} else {
		const git = await createGitRepository(gitConfig);
		contentPublisher = new GitContentPublisher(git);
	}

	const uploadDestinations = new Map();

	for (const field of fields) {
		if (field.type !== 'file') {
			continue;
		}

		const destination = await resolveDirectoryPath(gitConfig.path, field.destination)
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

	const fileFields = config
		.get('content.fields')
		.filter(field => field.type === 'file')
		.map(field => ({
			name: field.name,
			maxCount: field.multiple ? 100 : 1,
		}));

	// express application setup
	const app = express();

	app.engine('hbs', engine({
		extname: '.hbs',
		helpers: handlebarsHelpers,
	}));

	app.set('view engine', 'hbs');
	app.set('views', './views');

	app.use('/css', express.static(__dirname + '/node_modules/@picocss/pico/css/'));
	app.use(express.static('public'));

	app.get('/', (req, res) => {
		res.render('index.html.hbs', viewConfig);
	});
	app.get('/success', (req, res) => {
		res.render('success.html.hbs', viewConfig);
	});
	app.get('/manifest.json', (req, res) => {
		res.type('application/manifest+json');
		res.render('manifest.json.hbs', {
			layout: false,
			...viewConfig,
		});
	});

	app.post('/item', upload.fields(fileFields), async (req, res, next) => {
		try {
			console.log ('Validating input');
			const fields = config.get('content.fields');
			const validation = config.has('content.validation') ? config.get('content.validation') : {};
			const data = normalizeValues(fields, req.body, req.files || {});
			const errors = validateForm(fields, data, validation);

			if (Object.keys(errors).length > 0) {
				console.log ('input error');

				await cleanupFiles(req.files);

				return res.status(400).render(
					'index.html.hbs',
					{
						...viewConfig,
						values: req.body,
						errors,
					}
				);
			}

			//update repo to make sure we have the latest version and no merge conflicts
			await contentPublisher.prepare();

			console.log ('processing input');
			// create new files using content output the generate output
			const output = config.get('content.output');
			let createdFiles = await generateOutput(gitConfig.path, output, { data, fields } );
			
			// add uploaded files to created files
			const uploadedFiles = Object
				.values(req.files || {})
				.flat()
				.map(file => file.path);

			createdFiles = [ ...createdFiles, ...uploadedFiles, ];

			// remove repo dir from createdFiles paths
			createdFiles = createdFiles.map((item) => path.relative(gitConfig.path, item));

			// public the changes
			await contentPublisher.publish( files, commitMessage );

			res.redirect('success');
		} catch (error) {
			console.error(error);

			return res.status(500).render( 'index.html.hbs', {
				...viewConfig,
				values: req.body,
				errors: {
					_form: 'An unexpected error occurred while processing the form.',
				},
			} );
		}
	});

	return app;
}

setupApp().then(app => {
	const port = config.get('server.port');
	app.listen(port, () => {
		console.log('Listening at ' + port );
	});
}).catch(e => {
	console.error(e);
});
