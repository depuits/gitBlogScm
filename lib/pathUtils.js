const fs = require('node:fs/promises');
const path = require('node:path');

function assertInsideRepository(repoPath, resolvedPath, originalPath) {
    const relativePath = path.relative(repoPath, resolvedPath);

    if (
        relativePath === '..' ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Path must be inside the Git repository: ${originalPath}`
        );
    }
}

async function resolveDirectoryPath(repoPath, directoryPath) {
    const resolvedRepoPath = path.resolve(repoPath);
    const resolvedDirectoryPath = path.resolve(resolvedRepoPath, directoryPath);

    assertInsideRepository(resolvedRepoPath, resolvedDirectoryPath, directoryPath);

    await fs.mkdir(resolvedDirectoryPath, { recursive: true });

    return resolvedDirectoryPath;
}

async function resolveOutputPath(repoPath, outputPath) {
    const resolvedRepoPath = path.resolve(repoPath);
    const resolvedOutputPath = path.resolve(resolvedRepoPath, outputPath);

    assertInsideRepository(resolvedRepoPath, resolvedOutputPath, outputPath);

    await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });

    return resolvedOutputPath;
}

module.exports = {
    resolveDirectoryPath,
    resolveOutputPath,
};
