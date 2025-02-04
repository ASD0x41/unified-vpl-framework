# Unified VPL Framework

**A unified framework for the development and use of visual programming languages (VPLs) belonging to the block-based, flowchart-based, and dataflow-based paradigms.**

## Overview

Visual Programming Languages (VPLs) are increasingly important across various domains such as low-code development, end-user programming, robotics, IoT, and educational coding environments. However, the VPL ecosystem lacks standardization, and creating a new VPL is not as streamlined as creating a new textual programming language (TPL), which benefits from robust toolchains like Flex, Bison, and LLVM.

This **Unified VPL Framework** aims to solve this problem by providing a single platform for both the development and use of various VPLs. It enables developers to easily define new VPLs by writing a JSON file that describes the visual components, backend code, and other properties. This JSON definition is then rendered into a visual programming interface where users can drag-and-drop components onto a canvas and create visual programs.

The framework transpiles these visual programs into Python (with potential future support for other languages), compiles the Python code to WebAssembly using Pyodide, and executes the resulting code in an embedded console. The platform is implemented in React and packaged as a desktop app via Electron for offline use, enhanced performance, and improved privacy.

## Features

- **Unified platform for VPL development and usage**: Supports block-based, flowchart-based, and dataflow-based paradigms.
- **Developer-friendly**: Create new VPLs using a simple JSON file describing the components.
- **User-friendly IDE**: A single interface for working with various VPLs, allowing users to switch between paradigms with ease.
- **Drag-and-drop canvas**: Built using Fabric.js to allow intuitive visual programming.
- **Language transpilation**: Visual programs are transpiled to Python and compiled to WebAssembly for execution.
- **Cross-platform**: Runs as a desktop app via Electron or as a web app in the browser.
  
## Project Status

The project is currently in an **alpha** stage. A basic prototype is available for use and testing. 

You can try a web demo [here](https://web.nullprime.com/unified-vpl-framework).

### Demos

You can try out demos of the different visual programming language paradigms:

- **Block-based:** [Demo](https://web.nullprime.com/unified-vpl-framework/?type=block)
  - [block.json definition](https://web.nullprime.com/unified-vpl-framework/samples/block.json)
- **Flowchart-based:** [Demo](https://web.nullprime.com/unified-vpl-framework/?type=flow)
  - [flow.json definition](https://web.nullprime.com/unified-vpl-framework/samples/flow.json)
- **Dataflow-based:** [Demo](https://web.nullprime.com/unified-vpl-framework/?type=data)
  - [data.json definition](https://web.nullprime.com/unified-vpl-framework/samples/data.json)

Documentation will be available [here](https://web.nullprime.com/unified-vpl-framework/docs/).

## Installation

### Clone the repository:

    git clone https://github.com/ASD0x41/unified-vpl-framework.git

### Install dependencies:

    yarn install

### Run the app in the browser:

    yarn web

### Run the desktop app:

#### On Linux:

    yarn desktop

#### On Windows:

First, run the app in the browser:

    yarn web

Then, in a separate terminal:

    yarn electron-start

### Build for production:

    yarn package

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See the [LICENSE](LICENSE) file for more details.

## Contributing

We welcome contributions! Feel free to submit issues or pull requests to improve the framework.
