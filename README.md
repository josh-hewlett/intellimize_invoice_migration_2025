# Simple TypeScript Project

A minimal TypeScript project with a single `index.ts` file in the src directory.

## Project Structure

```
.
├── src/
│   └── index.ts    # Main TypeScript file
├── package.json    # Project dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── README.md       # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone this repository or download the files
2. Install dependencies:

```bash
npm install
```

### Development

To run the TypeScript file directly with ts-node:

```bash
npm run dev
```

### Building

To compile the TypeScript to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript.

### Running

To run the compiled JavaScript:

```bash
npm start
```

## Customizing

Feel free to modify the `src/index.ts` file to suit your needs. You can add more files to the `src` directory if your project grows.