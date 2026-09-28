const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const Handlebars = require('handlebars');

async function generateOutput(outputConfig, context) {
    const generatedFiles = [];

    for (const output of outputConfig.files) {
        const template = await loadTemplate(output);

        // Render the actual output content.
        const content = Handlebars.compile(template)(context);

        // Make the rendered content available as a hash for the filename.
        const hash = createHash('md5')
            .update(content)
            .digest('hex');

        const filenameContext = {
            ...context,
            hash,
        };

        const filename = Handlebars.compile(output.filename)(
            filenameContext
        );

        const destination = path.resolve(output.destination);

        await fs.mkdir(destination, { recursive: true });

        const filePath = path.join(destination, filename); //TODO take gitRepo into account

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

module.exports = generateOutput;
