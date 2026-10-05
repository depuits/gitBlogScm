const express = require("express");

function createContentRouter({ config, contentService, upload }) {
	const router = express.Router();

	const viewConfig = {
		app: config.get("app"),
		ui: config.get("ui"),
		content: {
			fields: config.get("content.fields"),
		},
	};

	router.get("/", (req, res) => {
		res.render("index.html.hbs", viewConfig);
	});
	router.get("/success", (req, res) => {
		res.render("success.html.hbs", viewConfig);
	});
	router.get("/manifest.json", (req, res) => {
		res.type("application/manifest+json");
		res.render("manifest.json.hbs", {
			layout: false,
			...viewConfig,
		});
	});

	router.post("/item", upload.middleware, async (req, res) => {
		try {
			const result = await contentService.create(req.body, req.files || {});

			if (!result.success) {
				return res.status(400).render("index.html.hbs", {
					...viewConfig,
					values: result.data,
					errors: result.errors,
				});
			}

			return res.redirect("/success");
		} catch (error) {
			console.error(error);

			return res.status(500).render("index.html.hbs", {
				...viewConfig,
				values: req.body,
				errors: {
					_form: "An unexpected error occurred while processing the form.",
				},
			});
		}
	});

	return router;
}

module.exports = { createContentRouter };
