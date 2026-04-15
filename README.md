# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## MailerLite access gate (signup)

Morpho signup is restricted to subscribers found in specific MailerLite groups.

### Supabase Function secrets

Set these secrets for the `check-mailerlite-access` function:

- `MAILERLITE_API_KEY` (required)
- `MAILERLITE_GROUP_ID` (required if single group)
- `MAILERLITE_GROUP_IDS` (optional, comma-separated for multiple groups)

If both `MAILERLITE_GROUP_ID` and `MAILERLITE_GROUP_IDS` are set, all listed group IDs are accepted.
