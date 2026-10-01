class ConsoleContentPublisher {
    async prepare() {
        console.log('[dev] Would update repository');
    }

    async publish(files, message) {
        console.log('[dev] Would publish changes:');
        console.log(files);
        console.log(`[dev] Commit message: ${message}`);
    }
}

module.exports = ConsoleContentPublisher;
