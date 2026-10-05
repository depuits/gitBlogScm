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

	content: {
		fields: [],
		validation: {},

		output: {
			files: [],
		},
	},
};
