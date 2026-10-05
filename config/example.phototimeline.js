module.exports = {
	app: {
		title: 'Photo timeline edit',
		shortTitle: 'Timeline edit',
		description: 'Add new item to photo timeline',
	},

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
