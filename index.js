const express = require('express');
const multer  = require('multer');


const upload = multer({ dest: 'uploads/' }); // TODO change location

const app = express();

// TODO load from somewhere (config/env/args)
const port = 3000;
const gitRepo = '';

// clone git repo if it does not exist

app.use(express.static('public'));

app.post('/item', upload.single('image'), function (req, res, next) {
/*
1. `git pull` # to make sure we have the latest version and no merge conflicts

2. upload and create new files

	// req.file is the `image` file
	// req.file.filename -> we only need the filename in or instance
	// req.body will hold the text fields, if there were any

	// add files and commit, push, etc

3. `git add .`
4. `git commit`
5. `git push`
*/
});

app.listen(port, () => {
    console.log('Listening at ' + port );
});
