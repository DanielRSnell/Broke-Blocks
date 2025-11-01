# Universal Block Editor Tweaks - React Components

This directory contains the React components for the Universal Block editor interface.

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch for changes during development
npm run dev
```

## Structure

- `src/components/` - React components
- `src/styles/` - CSS styles
- `src/index.js` - Main entry point

## Built Output

The built files are automatically output to `../../components/editor-tweaks/`:
- `universal-editor-tweaks-react.js` - Bundled JavaScript
- `universal-editor-tweaks-react.css` - Bundled CSS with all dependencies

## Dependencies

- **ace-builds**: Code editor with HTML syntax highlighting and Emmet support
- **remixicon**: Icon library for the interface
- **react**: UI framework (uses WordPress provided React)

All dependencies are bundled into the final output files.