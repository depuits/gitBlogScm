class GitContentPublisher {
	constructor(git) {
		this.git = git;
	}

	async prepare() {
		await this.git.pull();
	}

	async publish(files, message) {
		await this.git.add(files);
		await this.git.commit(message);
		await this.git.push();
	}
}

module.exports = GitContentPublisher;
