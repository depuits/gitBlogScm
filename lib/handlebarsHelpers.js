const Handlebars = require("handlebars");

module.exports = {
	json(value) {
		return new Handlebars.SafeString(JSON.stringify(value));
	},
	join(value, separator) {
		if (!Array.isArray(value)) {
			return "";
		}

		return value.join(separator);
	},
	ifEquals(value, expected, options) {
		return value === expected ? options.fn(this) : options.inverse(this);
	},
	includes(value, expected, options) {
		const values = Array.isArray(value) ? value : [value];

		return values.includes(expected) ? options.fn(this) : options.inverse(this);
	},
};
