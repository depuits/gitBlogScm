const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const Handlebars = require('handlebars');

async function generateOutput(repoPath, outputConfig, context) {
    const generatedFiles = [];

    for (const output of outputConfig.files) {
        const template = await loadTemplate(output);

        // Render the actual output content.
        const content = Handlebars.compile(template)(context);

        // Make the rendered content available as a hash for the filename.
        const hash = createHash('md5')
            .update(content)
            .digest('hex');

        const pathContext = {
            ...context,
            hash,
        };

        const outputPath = Handlebars.compile(output.path, { noEscape: true })(pathContext);
        const filePath = await resolveOutputPath(repoPath, outputPath);

        await fs.writeFile(filePath, content, 'utf8');

        generatedFiles.push(filePath);
    }

    return generatedFiles;
}

async function loadTemplate(output) {
    if (output.template && output.templateFile) {
        throw new Error(
            'Output configuration cannot contain both template and templateFile.'
        );
    }

    if (!output.template && !output.templateFile) {
        throw new Error(
            'Output configuration requires either template or templateFile.'
        );
    }

    if (output.template) {
        return output.template;
    }

    return fs.readFile(
        output.templateFile,
        'utf8'
    );
}

async function resolveOutputPath(repoPath, outputPath) {
    const resolvedRepoPath = path.resolve(repoPath);
    const resolvedOutputPath = path.resolve(resolvedRepoPath, outputPath);

    const relativeOutputPath = path.relative(resolvedRepoPath, resolvedOutputPath);

    if (
        relativeOutputPath === '..' ||
        relativeOutputPath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeOutputPath)
    ) {
        throw new Error(
            `Output path must be inside the Git repository: ${outputPath}`
        );
    }

    await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
    
    return resolvedOutputPath;
}

module.exports = generateOutput;
