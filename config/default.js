module.exports = {
	server: {
		port : 3000,
	},

	app: {
		title: 'Git Blog SCM',
		shortTitle: 'Blog SCM',
		description: 'Manage content for your static site',
	},

	ui: {
		buildStatus: {
			enabled: false,
			url: '',
			img: '',
			label: 'Build status',
		},
		submitLabel: 'Add',
	},

	git: {
		url: '',
		path: 'repo',

		auth: {
			username: '',
			password: '',
		},

		author: {
			name: 'gitBlogScm',
			email: '',
		},
	},

	// will be replaced with templating.
	content: {
		fields: [
			{
				name: 'image',
				label: 'Image',
				type: 'file',
				required: false,
				multiple: false,
				accept: [ 'image/*', ],
				destination: 'src/images',
			}, {
				name: 'description',
				label: 'Description',
				type: 'textarea',
				required: false,
			}, {
				name: 'collection',
				label: 'Collections',
				type: 'select',
				required: true,
				multiple: true,            
				options: [
					'joeri',
					'elien',
					'noah',
					'enzo',
				],
			}, {
				name: 'date',
				label: 'Date',
				type: 'date',
				required: true,
			}, {
				name: 'sortDate',
				label: 'SortDate',
				type: 'checkbox',
			},
		],
		validation: {
			anyOf: [
				[ 'image', 'description', ]
			],
		},

		output: {
			files: [
				{
					template: `---
collection:
{{#each data.collection}}
  - {{this}}
{{/each}}
{{#if data.image}}
image: "{{data.image.filename}}"
{{/if}}
{{#if data.description}}
desc: "{{data.description}}"
{{/if}}
{{#if data.sortDate}}
sortDate: "{{data.date}}"
{{else}}
date: "{{data.date}}"
{{/if}}
---
`,
					path: 'src/items/{{data.date}}_{{hash}}.md',
				},
			],
		},
	},
};
