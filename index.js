const express = require('express');
const multer  = require('multer');

const fs = require('fs');
const path = require('path');
const config = require('config');
const simpleGit = require('simple-git');
const handleForm = require('./handleForm.js');

const gitRepo = config.get('repo');
const gitUserName = config.get('gitUserName');
const gitUserMail = config.get('gitUserMail');

const repoDest = config.get('repoDest');
const fileUploadDest = path.join(repoDest, config.get('fileUploadDest'));
const fileCreateDest = path.join(repoDest, config.get('fileCreateDest'));

if (!gitRepo || !gitUserName || !gitUserMail) {
	console.error('Git config not complete.');
	process.exit(1);
}

async function setupApp() {
	// clone git repo if it does not exist
	const repoExists = fs.existsSync(repoDest);

	//create directory for git initialisation
	await fs.promises.mkdir(repoDest, {recursive:true});

	const git = simpleGit(repoDest);

	if (!repoExists) {
		console.log ('Cloning git repo: ' + gitRepo);
		await git.clone(gitRepo, '.');
	}

	await git.addConfig('user.name', gitUserName);
	await git.addConfig('user.email', gitUserMail);

	const upload = multer({ dest: fileUploadDest });
	const app = express();

	app.use('/css', express.static(__dirname + '/node_modules/@picocss/pico/css/'));
	app.use(express.static('public'));

	app.post('/item', upload.single('image'), async (req, res, next) => {
		try {
			//1. `git pull` # to make sure we have the latest version and no merge conflicts
			console.log ('pull');
			await git.pull();
			
			//2. upload and create new files
			console.log ('processing input');
			let changedFiles = await handleForm(fileCreateDest, req);

			// remove repo dir from changedFiles paths
			changedFiles = changedFiles.map((item) => path.relative(repoDest, item));

			//3. `git add .`
			console.log ('add file');
			//await git.add(changedFiles);

			//4. `git commit`
			const mfn = path.parse(changedFiles[0]).name;
			console.log ('create commit for ' + mfn);
			//await git.commit(`added item (${mfn})`);

			//5. `git push`
			console.log ('push');
			//await git.push();

			res.redirect('success.html');
		} catch (e) {
			return next(e)
		}
	});

	return app;
}

setupApp().then(app => {
	const port = config.get('port');
	app.listen(port, () => {
	    console.log('Listening at ' + port );
	});
}).catch(e => {
	console.error(e);
});
