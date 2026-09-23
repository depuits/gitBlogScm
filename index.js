const express = require('express');
const multer  = require('multer');
const crypto = require('node:crypto');
const { engine } = require('express-handlebars');

const fs = require('fs');
const path = require('path');
const config = require('config');
const simpleGit = require('simple-git');
const handleForm = require('./handleForm.js');

const devMode =
	process.argv.includes('--dev') ||
	process.argv.includes('--test');

const gitRepo = config.get('git.url');
const repoDest = config.get('git.path');
const gitUserName = config.get('git.userName');
const gitUserMail = config.get('git.userMail');

const fileUploadDest = path.join(repoDest, config.get('content.fileUploadDest'));
const fileCreateDest = path.join(repoDest, config.get('content.fileCreateDest'));

const viewConfig = {
    app: config.get('app'),
    ui: config.get('ui'),
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
	await fs.promises.mkdir(repoDest, {recursive:true});

	const git = simpleGit(repoDest);

	if (!devMode) {
		if (!repoExists) {
			console.log ('Cloning git repo: ' + gitRepo);
			await git.clone(gitRepo, '.');
		}

		await git.addConfig('user.name', gitUserName);
		await git.addConfig('user.email', gitUserMail);
	}
	
	const storage = multer.diskStorage({
		destination: fileUploadDest,
		filename: function (req, file, cb) {
			crypto.pseudoRandomBytes(16, function (err, raw) {
				if (err) return cb(err);

				cb(null, raw.toString('hex') + path.extname(file.originalname).toLowerCase()); //fix for missing extension files
			});
		},
	});
	const upload = multer({ storage: storage });
	const app = express();

	app.engine('hbs', engine({
		extname: '.hbs',
	}));

	app.set('view engine', 'hbs');
	app.set('views', './views');

	app.use('/css', express.static(__dirname + '/node_modules/@picocss/pico/css/'));
	app.use(express.static('public'));

	app.get('/', (req, res) => {
		res.render('index', viewConfig);
	});
	app.get('/success', (req, res) => {
		res.render('success', viewConfig);
	});

	app.post('/item', upload.single('image'), async (req, res, next) => {
		try {

			if (!devMode) {
				//1. `git pull` # to make sure we have the latest version and no merge conflicts
				console.log ('pull');
				await git.pull();
			}
			
			//2. upload and create new files
			console.log ('processing input');
			let changedFiles = await handleForm(fileCreateDest, req);

			// remove repo dir from changedFiles paths
			changedFiles = changedFiles.map((item) => path.relative(repoDest, item));

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
		} catch (e) {
			return next(e)
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
