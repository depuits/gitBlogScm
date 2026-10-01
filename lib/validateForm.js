function normalizeValues(fields, values, files) {
	const data = { ...values, };

	for (const field of fields) {
		if (field.type === 'file') {
			const fieldFiles = files[field.name] || [];

			data[field.name] = field.multiple ? fieldFiles : fieldFiles[0];
			continue;
		}

		if (field.multiple) {
			const value = data[field.name];
			if ( value === undefined || value === null || value === '' ) {
				data[field.name] = [];
			} else if (!Array.isArray(value)) {
				data[field.name] = [value];
			}
		}
	}

	return data;
}

function validateForm(fields, data, validation) {
	const errors = {};
	
	for (const field of fields) {
		const value = data[field.name];

		if ( field.required && !isProvided(field, value) ) { 
			errors[field.name] = `${field.label} is required`; 
			continue;
		}

		if ( field.maxLength && isProvided(field, value) && !field.multiple && String(value).length > field.maxLength ) {
			errors[field.name] = `${field.label} must be ${field.maxLength} characters or fewer`;
		}

		if (field.type === 'date' && isProvided(field, value) && !field.multiple && !isValidDate(value)) {
			errors[field.name] = `${field.label} is invalid`;
		}
	}

	validation ??= {};
	validateGroups('anyOf', validation.anyOf,               fields, data, errors);
	validateGroups('oneOf', validation.oneOf,               fields, data, errors);
	validateGroups('atMostOneOf', validation.atMostOneOf,   fields, data, errors);

	return errors;
}

function validateGroups(rule, groups, fields, data, errors) {
	if (!Array.isArray(groups)) {
		return;
	}

	const fieldsByName = new Map(fields.map(field => [field.name, field]));

	for (const group of groups) {
		if (!Array.isArray(group) || group.length === 0) {
			continue;
		}

		const provided = group.filter(name => {
			const field = fieldsByName.get(name);

			if (!field) {
				return false;
			}

			return isProvided(field, data[name]);
		});

		let valid;
		let message;

		const labels = group.map(name => {
			const field = fields.find(field => field.name === name);
			return field ? field.label : name;
		});

		switch (rule) {
			case 'anyOf':
				valid = provided.length >= 1;
				message = `At least one of these fields is required: ${labels.join(', ')}.`;
				break;

			case 'oneOf':
				valid = provided.length === 1;
				message = `Exactly one of these fields must be provided: ${labels.join(', ')}.`;
				break;

			case 'atMostOneOf':
				valid = provided.length <= 1;
				message = `At most one of these fields may be provided: ${labels.join(', ')}.`;
				break;

			default:
				continue;
		}

		if (valid) {
			continue;
		}

		for (const name of group) {
			// Preserve an existing, more specific field error.
			if (!errors[name]) {
				errors[name] = message;
			}
		}
	}
}
function isProvided(field, value) {
	if (field.multiple) {
		return Array.isArray(value) && value.length > 0;
	}

	if (value === undefined || value === null) {
		return false;
	}

	// if the value was not undefined here then the file is filled correctly
	// skip the next empty string check since we are here handling an object
	if (field.type === 'file') {
		return true;
	}

	return String(value).trim() !== '';
}

function isValidDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00Z`);

	return !Number.isNaN(date.getTime());
}


module.exports = {
    normalizeValues,
    validateForm,
};
