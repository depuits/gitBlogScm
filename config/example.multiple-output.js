module.exports = {
	app: {
		title: "Multiple output example",
		shortTitle: "Multiple output",
		description: "Example showing multiple generated files",
	},

	content: {
		fields: [
			{
				name: "title",
				label: "Title",
				type: "text",
				required: true,
			},
			{
				name: "description",
				label: "Description",
				type: "textarea",
				required: true,
			},
		],

		output: {
			files: [
				{
					template: `# {{data.title}}

{{data.description}}
`,
					path: "src/items/{{hash}}.md",
				},
				{
					template: `{
	"title": {{json data.title}},
	"description": {{json data.description}}
}
`,
					path: "src/items/{{hash}}.json",
				},
			],
		},
	},
};
