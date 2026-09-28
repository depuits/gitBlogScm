const express = require('express');
const multer  = require('multer');
const crypto = require('node:crypto');
const Handlebars = require('handlebars');
const { engine } = require('express-handlebars');

const fs = require('fs');
const path = require('path');
const config = require('config');
const simpleGit = require('simple-git');

const handlebarsHelpers = require('./lib/handlebarsHelpers');
const { normalizeValues, validateForm } = require('./lib/validateForm');
const generateOutput = require('./lib/generateOutput');

const devMode =
	process.argv.includes('--dev') ||
	process.argv.includes('--test');

const gitRepo = config.get('git.url');
const repoDest = config.get('git.path');
const gitUserName = config.get('git.userName');
const gitUserMail = config.get('git.userMail');

const viewConfig = {
	app: config.get('app'),
	ui: config.get('ui'),
	content: {
		fields: config.get('content.fields'),
	},
};

if (devMode) {
	console.log('Running in development/test mode - Git actions disabled.');
} else {	
	if (!gitRepo || !gitUserName || !gitUserMail) {
		console.error('Git config not complete.');
		process.exit(1);
	}
}

async function setupApp() {
	// clone git repo if it does not exist
	const repoExists = fs.existsSync(repoDest);

	//create directory for git initialisation
	await fs.promises.mkdir(repoDest, { recursive:true });

	const git = simpleGit(repoDest);

	if (!devMode) {
		if (!repoExists) {
			console.log ('Cloning git repo: ' + gitRepo);
			await git.clone(gitRepo, '.');
		}

		await git.addConfig('user.name', gitUserName);
		await git.addConfig('user.email', gitUserMail);
	}
	
	const fileFieldsByName = config
		.get('content.fields')
		.filter(field => field.type === 'file')
		.map(field => [field.name, field]);

	// multer file upload setup
	const storage = multer.diskStorage({
		destination: async (req, file, callback) => {
			try {
				const field = fileFieldsByName.get(file.fieldname);

				if (!field) {
					return callback(
						new Error(`Unexpected file field: ${file.fieldname}`)
					);
				}

				const destination = field.destination;
				const repoDestination = path.join(repoDest, destination);
				await fs.promises.mkdir(repoDestination, { recursive: true });

				callback(null, repoDestination);
			} catch (error) {
				callback(error);
			}
		},
		filename: function (req, file, cb) {
			crypto.pseudoRandomBytes(16, function (err, raw) {
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
			if (!devMode) {
				//1. `git pull` # to make sure we have the latest version and no merge conflicts
				console.log ('pull');
				await git.pull();
			}
			
			//2. upload and create new files
			console.log ('processing input');

			const fields = config.get('content.fields');
			const validation = config.has('content.validation') ? config.get('content.validation') : {};
			const data = normalizeFormData(fields, req.body, req.files || {});
			const errors = validateForm(fields, data, validation);

			if (Object.keys(errors).length > 0) {
				console.log ('input error');

				return res.status(400).render(
					'index.html.hbs',
					{
						...viewConfig,
						values: req.body,
						errors,
					}
				);
			}

			//TODO use generateoutput
			//const output = config.get('content.output');
			//let changedFiles = await generateOutput(output, { data, fields } );
			
			// remove repo dir from changedFiles paths
			//changedFiles = changedFiles.map((item) => path.relative(repoDest, item));

			if (devMode) {
				console.log('DEV MODE: skipping git add/commit/push');
				console.log('Changed files:', changedFiles);
			} else {
				//3. `git add .`
				console.log ('add file');
				await git.add(changedFiles);

				//4. `git commit`
				const mfn = path.parse(changedFiles[0]).name;
				console.log ('create commit for ' + mfn);
				await git.commit(`added item (${mfn})`);

				//5. `git push`
				console.log ('push');
				await git.push();
			}

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
