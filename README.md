# Task Management App

A responsive task manager built with React, TypeScript, and Vite.

## Run locally

```bash
npm install
npm run server
# In a second terminal:
npm run dev
```

Open the local URL printed by Vite. Use your name and email to enter the demo workspace. Create, edit, complete, search, filter, and delete tasks from the dashboard. Tasks are stored in this browser and separated by email address.

## Verification

```bash
npm run build
npm run lint
```

## API

The Express API exposes the following endpoints (started with `npm run server`):

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

Task data is held in memory for the demo, so restarting the API clears its data.

## Authentication note

Sign-in is a local demonstration only. It does not verify identity or provide secure authorization, and browser storage can be inspected or modified by the browser user. A production deployment needs a trusted authentication provider and server-side data storage with ownership checks.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
