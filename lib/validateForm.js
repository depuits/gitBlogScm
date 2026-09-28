function validateForm(fields, values, files, validation) {
	const errors = {};
	
	for (const field of fields) {
		if (field.type === 'file') {
			const uploadedFiles = files[field.name] || [];

			if (field.required && uploadedFiles.length === 0) {
				 errors[field.name] = `${field.label} is required`;
			}

			if (!field.multiple && uploadedFiles.length > 1) {
				errors[field.name] = `${field.label} accepts only one file`;
			}

			continue;
		}

		const value = values[field.name];

		if (
			field.required &&
			(!value || String(value).trim() === '')
		) {
			errors[field.name] = `${field.label} is required`;
			continue;
		}

		if (
			field.maxLength &&
			value &&
			String(value).length > field.maxLength
		) {
			errors[field.name] =
				`${field.label} must be ${field.maxLength} characters or fewer`;
		}

		if (
			field.type === 'date' &&
			value &&
			!isValidDate(value)
		) {
			errors[field.name] = `${field.label} is invalid`;
		}
	}

	validation ??= {};
	validateGroups('anyOf', validation.anyOf,               fields, values, files, errors);
	validateGroups('oneOf', validation.oneOf,               fields, values, files, errors);
	validateGroups('atMostOneOf', validation.atMostOneOf,   fields, values, files, errors);

	return errors;
}

function validateGroups(rule, groups, fields, values, files, errors) {
	if (!Array.isArray(groups)) {
		return;
	}

	for (const group of groups) {
		if (!Array.isArray(group) || group.length === 0) {
			continue;
		}

		const provided = group.filter(name => {
			const field = fields.find(field => field.name === name);

			if (!field) {
				return false;
			}

			if (field.type === 'file') {
				return (files[name] || []).length > 0;
			}

			const value = values[name];

			if (Array.isArray(value)) {
				return value.some(item => String(item).trim() !== '');
			}

			return value !== undefined &&
				value !== null &&
				String(value).trim() !== '';
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

function isValidDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00Z`);

	return !Number.isNaN(date.getTime());
}

module.exports = validateForm;
