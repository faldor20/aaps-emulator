# AAPS emulator
A very experimental and in-dev web ui for emulating autisf to assist users tune their loop.

## Developing
**This project uses pnpm not npm, ensure you have it installed** 
Once you've created a project and installed dependencies with `pnpm install` start a development server:

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
