function createAsyncLock() {
	let queue = Promise.resolve();

	return {
		async runExclusive(callback) {
			let release;

			const previous = queue;

			queue = new Promise(resolve => {
				release = resolve;
			});

			await previous;

			try {
				return await callback();
			} finally {
				release();
			}
		},
	};
}

module.exports = createAsyncLock;
