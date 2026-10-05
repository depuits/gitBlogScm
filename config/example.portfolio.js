module.exports = {
	app: {
		title: "Portfolio editor",
		shortTitle: "Portfolio",
		description: "Add a portfolio project",
	},

	content: {
		fields: [
			{
				name: "title",
				label: "Project title",
				type: "text",
				required: true,
			},
			{
				name: "category",
				label: "Category",
				type: "select",
				required: true,
				options: ["Web", "Photography", "Design", "Other"],
			},
			{
				name: "description",
				label: "Description",
				type: "textarea",
				required: true,
			},
			{
				name: "url",
				label: "Project URL",
				type: "text",
				required: false,
			},
			{
				name: "images",
				label: "Images",
				type: "file",
				required: true,
				multiple: true,
				accept: ["image/*"],
				destination: "src/images/portfolio",
			},
		],

		validation: {
			anyOf: [["url", "images"]],
		},

		output: {
			files: [
				{
					template: `---
title: "{{data.title}}"
category: "{{data.category}}"
{{#if data.url}}
url: "{{data.url}}"
{{/if}}
images:
{{#each data.images}}
  - "{{this.filename}}"
{{/each}}
---

{{data.description}}
`,
					path: "src/projects/{{hash}}.md",
				},
			],
		},
	},
};
