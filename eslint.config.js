const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	js.configs.recommended,
	{
		files: ["**/*.js"],
		ignores: ["node_modules/**"],
		languageOptions: {
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
	},
	{
		files: ["public/**/*.js"],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
];
