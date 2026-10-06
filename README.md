# gitBlogScm

A small, configuration-driven content management interface for Git-backed static websites.

It is designed for situations where Git is a great source of truth for content, but the people creating or maintaining that content should not need to know how Git works.

You configure the fields that users should fill in, and gitBlogScm takes care of turning those submissions into files, committing the changes to Git, and pushing them to the configured remote repository.

gitBlogScm does **not** build or publish the resulting website. Your existing CI/CD pipeline remains responsible for building and publishing the site after gitBlogScm pushes a change.

## Why?

Git is a useful content store for static websites:

- content remains human-readable and can still be edited directly by developers or other tools;
- every change made through gitBlogScm becomes a normal Git commit;
- the repository therefore keeps the complete Git history of the content;
- existing CI/CD workflows can react to those commits;
- there is no separate database or proprietary content store to keep in sync.

gitBlogScm adds a user-friendly UI on top of this workflow for people who should not have to work with Git directly.

For example, a [Metalsmith](https://metalsmith.io/) website can use Git as its content source, let gitBlogScm create or update the source files, and then let CI/CD rebuild the static website.

The same approach can be used with other static-site generators or with repositories containing static content directly. The generated files are yours; gitBlogScm does not require a particular website generator.

## Use cases

gitBlogScm can be configured for many kinds of Git-backed content, including:

- **Blogs** — create posts with titles, dates, authors, tags, images, and Markdown content.
- **Portfolios** — maintain projects with descriptions, categories, links, and multiple images.
- **Documentation** — provide forms for structured documentation or metadata.
- **Events and news** — collect dates, descriptions, images, and other event information.
- **Product or content catalogs** — maintain structured entries that are rendered by a static-site generator.
- **Team directories** — manage people and their associated metadata.
- **Static configuration/content** — generate JSON, Markdown, YAML, or other files from submitted data.

## How it works

The basic workflow is:

```text
User
  │
  ▼
gitBlogScm web UI
  │
  ├── validate form data
  ├── save uploaded files
  ├── generate configured output files
  └── commit and push changes
          │
          ▼
      Git repository
          │
          ▼
        CI/CD
          │
          ▼
   build and publish website
```

The application does not introduce a separate database or content store. Changes made through the UI become normal Git commits, so the repository can still be edited directly by developers or other tools.

## Configuration

gitBlogScm uses [node-config](https://github.com/node-config/node-config) for configuration.

The application already provides a `config/default.js` containing the base configuration. You normally **do not replace this file**. Instead, add only the settings that need to differ using node-config's normal override hierarchy.

At a high level, configuration is loaded in this order:

```text
config/default.js
        ↓
deployment/environment override
        ↓
hostname override
        ↓
local override
        ↓
custom environment variables
```

For example:

```text
config/
├── default.js
├── production.js
├── my-server.js
└── local.js
```

`production.js` can contain production-specific settings, a hostname-specific file can contain settings for one server, and `local.js` can contain machine-local settings that should not be committed.

Only the values that need to change have to be specified in an override file. node-config merges the configuration files rather than requiring each file to contain the complete configuration.

This is only a high-level overview. See the [node-config configuration file documentation](https://github.com/node-config/node-config/wiki/Configuration-Files) for the complete loading hierarchy, supported file formats, and other options.

### Configuration sources

There are two particularly useful ways to provide configuration:

1. **Configuration files** — preferred for larger configurations. Add an appropriate node-config override such as `production.js`, a hostname-specific file, or `local.js`.
2. **`NODE_CONFIG`** — useful for small configurations or container environments where putting the configuration directly into an environment variable is convenient.

Secrets should not normally be put into `NODE_CONFIG`. gitBlogScm exposes sensitive Git settings through dedicated environment variables instead.

### Application and UI customization

The `app` and `ui` sections provide basic customization of the application itself, without changing the content model.

The `app` section controls the application text shown in the interface:

```js
app: {
	title: 'Photo timeline edit',
	shortTitle: 'Photo timeline',
	description: 'Manage content for your photo timeline',
}
```

- `title` — full application title.
- `shortTitle` — shorter title used where space is limited.
- `description` — description shown by the application.

The `ui` section controls small aspects of the interface:

```js
ui: {
	submitLabel: 'Add',
	buildStatus: {
		enabled: false,
		url: '',
		label: 'Build status',
	},
}
```

- `submitLabel` — label used for the form submission button.
- `buildStatus.enabled` — enables the build-status indicator.
- `buildStatus.url` — URL used for the build-status information.
- `buildStatus.label` — label displayed for the build status.

These settings are intended for basic branding and UI customization. The content configuration is described in [Content configuration](#content-configuration).

### Example configurations

The repository contains complete working examples:

- [Photo timeline](config/example.phototimeline.js)
- [Blog](config/example.blog.js)
- [Portfolio](config/example.portfolio.js)
- [Multiple output files](config/example.multiple-output.js)

These examples are also used during development; see [Development](#development).

## Git configuration

gitBlogScm needs a Git remote and an author identity.

For HTTPS repositories, `GIT_USERNAME` and `GIT_PASSWORD` can be used for authentication. For services such as GitHub, the password value will normally be a personal access token rather than an account password.

### Environment variables

The following environment variables are mapped into the gitBlogScm configuration:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `SERVER_PORT` | No | `3000` | HTTP port used by gitBlogScm. |
| `GIT_URL` | **Yes** | — | Git repository URL. |
| `GIT_PATH` | No | `repo` | Local directory in which the Git repository is cloned. |
| `GIT_USERNAME` | No | — | Username used for authenticated Git access. |
| `GIT_PASSWORD` | No | — | Password/token used for authenticated Git access. |
| `GIT_AUTHOR_NAME` | No | `gitBlogScm` | Name used for commits created by gitBlogScm. |
| `GIT_AUTHOR_EMAIL` | **Yes** | — | Email address used for commits created by gitBlogScm. |

`GIT_USERNAME` and `GIT_PASSWORD` are only needed when the configured remote requires them.

## Content configuration

The main application-specific configuration lives under `content`.

A content configuration defines:

- the fields displayed in the web form;
- optional validation rules between fields;
- the files that should be generated after a successful submission.

A simplified configuration looks like this:

```js
module.exports = {
	content: {
		fields: [
			{
				name: 'title',
				label: 'Title',
				type: 'text',
				required: true,
			},
			{
				name: 'description',
				label: 'Description',
				type: 'textarea',
				maxLength: 500,
			},
			{
				name: 'tags',
				label: 'Tags',
				type: 'select',
				multiple: true,
				options: ['news', 'travel', 'personal'],
			},
		],
		output: {
			files: [
				{
					template: `---
title: "{{data.title}}"
tags:
{{#each data.tags}}
  - {{this}}
{{/each}}
---
{{data.description}}
`,
					path: 'src/items/{{data.title}}_{{hash}}.md',
				},
			],
		},
	},
};
```

### Fields

Each field has a `name`, `label`, and `type`.

Common options include:

| Option | Description |
| --- | --- |
| `name` | Property name used in submitted data. |
| `label` | Label displayed in the form. |
| `type` | Field type. |
| `required` | Whether the field must contain a value. |
| `multiple` | Whether the field accepts multiple values in `select` or files in `file`. |
| `options` | Available values for a `select` field. |
| `maxLength` | Maximum length for a `textarea`. |
| `accept` | Accepted file types for a `file` field. |
| `destination` | Directory inside the repository where uploaded files are stored. |

### Field types

gitBlogScm has four special field types:

- **`textarea`** — renders a multiline text field. Supports `maxLength` and the other common field options.
- **`checkbox`** — renders a checkbox.
- **`select`** — renders a select control. Use `options` to define the available values. `multiple: true` allows multiple selections.
- **`file`** — uploads a file into the configured repository directory. `multiple: true` allows multiple files.

All other field types are passed directly to the HTML `<input type="...">` element. This means standard HTML input types such as `text`, `email`, `number`, `date`, `url`, and others can be used.

See the [MDN `<input>` documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) for the standard HTML input types and their available attributes.

### File uploads

File fields use [Multer](https://github.com/expressjs/multer) to process multipart form uploads.

The most important file-specific configuration options are:

- `multiple` — whether the field accepts multiple files.
- `accept` — passed to the HTML file input to indicate the accepted file types.
- `destination` — directory inside the configured repository where the uploaded files are stored.

Uploaded files are given a generated filename consisting of 32 hexadecimal characters followed by the lower-case original file extension:

```text
a8f3d0e5c1b24d7e8a4f9b1c2d3e4f56.jpg
```

The original filename is still available through the uploaded file metadata.

For the complete Multer API and available file metadata, see the [Multer documentation](https://github.com/expressjs/multer).

### Submitted data

The values submitted by the user are normalized into a `data` object.

Each configured field becomes a property of `data` using the field's `name`.

For example:

```js
{
	data: {
		title: 'My article',
		tags: ['news', 'travel'],
		image: {
			filename: 'a8f3d0e5c1b24d7e8a4f9b1c2d3e4f56.jpg',
			// other uploaded file metadata
		},
	},
	fields: [
		// configured field definitions
	],
}
```

For normal fields:

- a field with `multiple: false` produces a scalar value;
- a field with `multiple: true` produces an array.

For file fields:

- a file field with `multiple: false` produces the uploaded file object;
- a file field with `multiple: true` produces an array of uploaded file objects.

Empty multiple fields are normalized to an empty array.

The `fields` array contains the configured field definitions and is available when generating output.

## Validation

Validation can be configured for individual fields and for relationships between fields.

### Required fields

Set `required: true` on a field to require a value.

For multiple fields, at least one value must be provided.

### `anyOf`

Requires at least one field in each group to be provided.

```js
validation: {
	anyOf: [
		['image', 'description'],
	],
}
```

The example above requires either an `image`, a `description`, or both.

### `oneOf`

Requires exactly one field from each group to be provided.

```js
validation: {
	oneOf: [
		['image', 'video'],
	],
}
```

### `atMostOneOf`

Allows zero or one field from each group, but never more than one.

```js
validation: {
	atMostOneOf: [
		['image', 'video'],
	],
}
```

Date fields are also validated as real `YYYY-MM-DD` dates rather than merely checking that the value has the correct shape.

## Content generation

After the form has been validated and files have been uploaded, gitBlogScm generates the configured output files using [Handlebars](https://handlebarsjs.com/).

Each output entry provides either:

- `template` — an inline Handlebars template; or
- `templateFile` — a template loaded from a file.

The generated content is written to the configured `path`. The `path` is also passed through Handlebars giving you full control of the final path.

### Template variables

Templates receive the following variables:

| Variable | Description |
| --- | --- |
| `data` | Normalized values submitted by the user. |
| `fields` | The configured field definitions. |
| `hash` | An MD5 hash of the generated file content. |

The hash can be used to create unique output filenames:

```js
path: 'src/items/{{data.date}}_{{hash}}.md'
```

The hash is calculated from the rendered content, so the same content produces the same hash and is only available for the `path` rendering.

### Handlebars helpers

gitBlogScm provides these helpers:

- `json` — render a value as JSON.
- `join` — join an array of values.
- `ifEquals` — conditionally render content when two values are equal.
- `includes` — conditionally render content when a value is contained in an array.

For everything else, see the [Handlebars documentation](https://handlebarsjs.com/).

## Git workflow

When running normally, gitBlogScm follows this workflow:

1. Clone the configured Git repository when the application starts.
2. Pull the latest changes before publishing a new submission.
3. Write uploaded files to the repository.
4. Generate the configured output files.
5. Stage the changed files.
6. Create a Git commit using the configured author.
7. Push the commit to the configured remote.

The repository remains the source of truth throughout this process.

Because gitBlogScm creates ordinary Git commits, changes made through the UI are part of the repository's normal history and can be inspected, reverted, or otherwise managed using standard Git tools.

## Publishing and CI/CD

gitBlogScm does not build the website and does not deploy it.

After gitBlogScm pushes a commit, your existing CI/CD system can detect the change and perform the build and deployment.

For example:

```text
gitBlogScm
    │
    ▼
Git push
    │
    ▼
CI/CD pipeline
    │
    ├── build static site
    └── publish
```

This can be any CI/CD or hosting workflow that works with your repository. [GitHub Pages](https://docs.github.com/en/pages) is one example of a service that can host websites directly from GitHub repositories.

## Docker

Docker is the recommended way to run gitBlogScm outside of development.

The published container image is:

```text
ghcr.io/depuits/gitblogscm/gitblogscm
```

Images are versioned using [Semantic Versioning](https://semver.org/). The `latest` tag points to the build of the `master` branch.

### Minimal `docker run`

For a small configuration, `NODE_CONFIG` can be convenient:

```bash
docker run --rm \
	-p 3000:3000 \
	-e GIT_URL="https://github.com/example/site.git" \
	-e GIT_USERNAME="example" \
	-e GIT_PASSWORD="your-token" \
	-e GIT_AUTHOR_EMAIL="gitblogscm@example.com" \
	-e NODE_CONFIG='{"app":{"title":"My content editor"}}' \
	ghcr.io/depuits/gitblogscm/gitblogscm:latest
```

For real deployments, prefer Docker Compose so configuration and secrets are easier to manage.

### Docker Compose with `NODE_CONFIG`

This approach is useful for a relatively small configuration:

```yaml
services:
	gitblogscm:
		image: ghcr.io/depuits/gitblogscm/gitblogscm:latest
		ports:
			- "3000:3000"
		environment:
			NODE_ENV: production
			NODE_CONFIG: >-
				{
					"app": {
						"title": "My content editor",
						"shortTitle": "Content editor",
						"description": "Manage website content"
					},
					"content": {
						"fields": [],
						"output": {
							"files": []
						}
					}
				}
			GIT_URL: ${GIT_URL}
			GIT_USERNAME: ${GIT_USERNAME}
			GIT_PASSWORD: ${GIT_PASSWORD}
			GIT_AUTHOR_EMAIL: ${GIT_AUTHOR_EMAIL}
```

Keep credentials such as `GIT_PASSWORD` outside `NODE_CONFIG`.

### Docker Compose with a configuration-file mount

For a larger configuration, use a normal node-config override file.

For example, create:

```text
config/
└── production.js
```

with only the settings that differ from `config/default.js`.

Then mount that individual file into the image:

```yaml
services:
	gitblogscm:
		image: ghcr.io/depuits/gitblogscm/gitblogscm:latest
		ports:
			- "3000:3000"
		environment:
			NODE_ENV: production
			GIT_URL: ${GIT_URL}
			GIT_USERNAME: ${GIT_USERNAME}
			GIT_PASSWORD: ${GIT_PASSWORD}
			GIT_AUTHOR_EMAIL: ${GIT_AUTHOR_EMAIL}
		volumes:
			- ./config/production.js:/usr/src/config/production.js:ro
```

> [!WARNING]  
> Do not mount the complete `/usr/src/config` directory. This would replace the image's built-in `default.js` and `custom-environment-variables.json` and break the default configuration and environment variable mapping.

The mounted configuration should contain only the values that need to override the defaults.

### Persisting the Git repository

By default, gitBlogScm clones the configured repository when it starts.

The local repository directory can optionally be persisted using a Docker volume. This avoids cloning the repository again after every container restart and can make startup faster:

```yaml
services:
	gitblogscm:
		image: ghcr.io/depuits/gitblogscm/gitblogscm:latest
		volumes:
			- gitblogscm-repo:/usr/src/repo

volumes:
	gitblogscm-repo:
```

Persistence is optional. The Git remote remains the source of truth, so a fresh container can recreate the local clone when necessary.

## Development

Development mode is useful when working on gitBlogScm itself or testing a configuration.

Install dependencies:

```bash
npm install
```

Run the application in development mode:

```bash
npm run dev
```

Development and test mode use the console content publisher instead of performing Git operations.

The important distinction is that **file operations still happen**. Uploaded files and generated output are written to the configured local repository directory, but no Git pull, commit, or push is performed. That directory can simply be a local working folder; it does not have to be an actual Git repository.

### Example configurations

The repository contains several example configurations that can be run during development:

```bash
npm run example:phototimeline
npm run example:blog
npm run example:portfolio
npm run example:multiple-output
```

The corresponding configuration files are:

- [Photo timeline](config/example.phototimeline.js)
- [Blog](config/example.blog.js)
- [Portfolio](config/example.portfolio.js)
- [Multiple output files](config/example.multiple-output.js)

These examples demonstrate different combinations of fields, validation rules, uploads, and generated output files.

### Code quality

The project uses ESLint and Prettier for basic code quality and formatting checks.

```bash
npm run check
```

Formatting can be checked or applied with:

```bash
npm run format:check
npm run format
```

Linting can be run with:

```bash
npm run lint
```

## Architecture

gitBlogScm is intentionally split into small layers:

```text
index.js
  │
  ├── configuration
  ├── Git setup
  └── application composition
          │
          ▼
       app.js
          │
          ├── Express
          ├── middleware
          └── routes
                 │
                 ▼
          contentService
                 │
                 ├── validation
                 ├── file generation
                 └── publishing
                         │
                         ▼
                 ContentPublisher
                    ├── Git
                    └── Console
```

The publisher abstraction keeps content publishing separate from the rest of the application. Git is currently the only implemented publisher, but the abstraction leaves room for other version-control systems to be implemented in the future if there is a need for them.

## Design principles

gitBlogScm intentionally tries to follow a few simple principles:

**Git is the source of truth**

Content lives in Git rather than in a separate database owned by gitBlogScm. There is no separate content database that must remain synchronized with the repository.

**Configuration over hard-coded content models**

The application should not need to know whether it is managing blog posts, photographs, projects, documentation, or another kind of content. Forms, validation, and generated files are described through configuration rather than application-specific code.

**A friendly UI over version control**

Git is powerful but can be complex and intimidating for people who only need to add or update content. gitBlogScm provides a user-friendly UI over Git while keeping the repository directly accessible to developers and automation.

**No migration required**

gitBlogScm should be able to sit on top of an existing repository. It does not require content to be imported into a proprietary data store before the application can be used.

**Generated output is just files**

gitBlogScm writes normal files into the repository. It does not impose a particular Markdown, frontmatter, JSON, or other output structure on the target repository.

**Keep publishing separate**

gitBlogScm changes the content repository; it does not build or publish the resulting website. Building and publishing remain the responsibility of CI/CD.

## Content management roadmap

Creating new content is currently the main supported workflow.

Broader **content management** capabilities are planned, allowing existing repository content to be managed through the UI as well. These capabilities are tracked in the project's issue tracker and will be added incrementally.

## Versioning

gitBlogScm follows [Semantic Versioning](https://semver.org/).

Release versions use normal SemVer version numbers. The `latest` container image tag represents the current build of the `master` branch and should therefore be treated as a moving development version rather than a fixed release.
