const fs = require("node:fs");
const path = require("node:path");
const { simpleGit } = require("simple-git");

function validateGitConfig(gitConfig) {
	const missing = [];

	if (!gitConfig.url) {
		missing.push("git.url");
	}

	if (!gitConfig.author?.name) {
		missing.push("git.author.name");
	}

	if (!gitConfig.author?.email) {
		missing.push("git.author.email");
	}

	if (missing.length > 0) {
		throw new Error(
			`Git configuration incomplete. Missing: ${missing.join(", ")}`,
		);
	}
}

function authenticatedUrl(url, auth) {
	if (!auth?.username && !auth?.password) {
		return url;
	}

	const parsedUrl = new URL(url);

	parsedUrl.username = encodeURIComponent(auth.username);
	parsedUrl.password = encodeURIComponent(auth.password);

	return parsedUrl.toString();
}

async function createGitRepository(gitConfig) {
	validateGitConfig(gitConfig);

	const repoPath = path.resolve(gitConfig.path);

	await fs.promises.mkdir(repoPath, { recursive: true });

	const git = simpleGit(repoPath);

	const gitDirectory = path.join(repoPath, ".git");

	if (!fs.existsSync(gitDirectory)) {
		console.log(`Cloning git repo: ${gitConfig.url}`);

		const remoteUrl = authenticatedUrl(gitConfig.url, gitConfig.auth);

		await git.clone(remoteUrl, ".");
	}

	await git.addConfig("user.name", gitConfig.author.name);
	await git.addConfig("user.email", gitConfig.author.email);

	return git;
}

module.exports = {
	createGitRepository,
};
