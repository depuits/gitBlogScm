const express = require('express');
const { engine } = require('express-handlebars');

const handlebarsHelpers = require('./lib/handlebarsHelpers');

const { createUpload } = require('./routes/upload');
const { createContentRouter } = require('./routes/content');

async function createApp({ repoPath, config, contentService }) {
	const upload = await createUpload({ repoPath, config });
	const app = express();

	app.engine('hbs', engine({
		extname: '.hbs',
		helpers: handlebarsHelpers,
	}));

	app.set('view engine', 'hbs');
	app.set('views', './views');

	app.use('/css', express.static(__dirname + '/node_modules/@picocss/pico/css/'));
	app.use(express.static('public'));

    app.use(createContentRouter({
        config,
        contentService,
        upload
    }));

	return app;
}

module.exports = { createApp };
