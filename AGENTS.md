# Development guidance

This is a generic, bilingual studio website template. Keep sample content clearly identified as examples. Never add private client work, personal profiles, production configuration or credentials to the repository.

Preserve responsive layouts, the dark gold / light blue themes, Chinese / English controls, visible keyboard focus and reduced-motion behavior. Use the existing npm lockfile. Validate changes with `npm run lint` and `npm run build`, then check affected pages in a browser.

Content is stored in local JSON files. Uploaded files and lead submissions are runtime data and must remain ignored by Git. Admin access requires both environment variables; do not introduce shared default credentials. Optional SMTP and course integrations require explicit configuration.
