const path = require('path');
const config = require('config');

const { createApp } = require('./app');

const { createGitRepository } = require('./lib/git');
const GitContentPublisher = require('./lib/contentPublishers/gitContentPublisher');
const ConsoleContentPublisher = require('./lib/contentPublishers/consoleContentPublisher');

const { createContentService } = require('./services/contentService');

async function main() {
	const devMode = 
		process.argv.includes('--dev') ||
		process.argv.includes('--test');

	const gitConfig = {
		...config.get('git'),
		path: path.resolve(config.get('git.path')),
	};

	let contentPublisher;
	if (devMode) { 
		console.log('Running in development/test mode - Git actions disabled.');
		contentPublisher = new ConsoleContentPublisher();
	} else {
		const git = await createGitRepository(gitConfig);
		contentPublisher = new GitContentPublisher(git);
	}

	const contentService = createContentService({
		repoPath: gitConfig.path,
		config,
		contentPublisher,
	});

	const app = await createApp({ 
		repoPath: gitConfig.path,
		config,
		contentService,
	});

	const port = config.get('server.port');
	app.listen(port, () => {
		console.log('Listening at ' + port );
	});
}

main().catch(e => {
	console.error(e);
    process.exitCode = 1;
});
