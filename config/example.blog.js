module.exports = {
	app: {
		title: 'Blog editor',
		shortTitle: 'Blog',
		description: 'Create a new blog post',
	},

	content: {
		fields: [
			{
				name: 'title',
				label: 'Title',
				type: 'text',
				required: true,
			}, {
				name: 'date',
				label: 'Date',
				type: 'date',
				required: true,
			}, {
				name: 'author',
				label: 'Author',
				type: 'text',
				required: true,
			}, {
				name: 'tags',
				label: 'Tags',
				type: 'select',
				required: false,
				multiple: true,
				options: [
					'technology',
					'travel',
					'personal',
					'projects',
				],
			}, {
				name: 'image',
				label: 'Header image',
				type: 'file',
				required: false,
				multiple: false,
				accept: [ 'image/*', ],
				destination: 'src/images',
			}, {
				name: 'body',
				label: 'Content',
				type: 'textarea',
				required: true,
			},
		],

		output: {
			files: [
				{
					template: `---
title: "{{data.title}}"
date: "{{data.date}}"
author: "{{data.author}}"
{{#if data.tags}}
tags:
{{#each data.tags}}
  - {{this}}
{{/each}}
{{/if}}
{{#if data.image}}
image: "{{data.image.filename}}"
{{/if}}
---

{{data.body}}
`,
					path: 'src/posts/{{data.date}}_{{hash}}.md',
				},
			],
		},
	},
};
