# Link Editor

## Overview

Link Editor is a powerful userscript that enhances web browsing by allowing users to customize link titles and behavior across websites. It provides a user-friendly interface for managing link attributes and improving navigation.

## Key Features

- Add custom tooltips to links based on their text content
- Control whether links open in new tabs
- Apply customizations to specific URL patterns
- Easy-to-use settings panel for managing rules
- Drag-and-drop interface for organizing rules
- Shortcut key `Ctrl + Alt + 0` to quickly access settings

## How It Works

1. Users define rules using CSS selectors to target specific elements
2. The script adds title attributes to matched elements, creating tooltips
3. For linked elements, it can set them to open in new tabs
4. Rules are applied dynamically as the page changes

## Usage

- Open the settings panel via the browser's userscript menu or the `Ctrl + Alt + 0` shortcut
- Add new rules by clicking the '+' button
- Configure each rule with:
  - Title: The text to display in the tooltip
  - Selector: CSS selector to target elements
  - URL Pattern: Regular expression to match website URLs
  - Enable/Disable toggle
  - "Open in new tab" option for links

## Technical Details

- Uses MutationObserver to handle dynamic content
- Stores settings in GM_setValue for persistence
- Implements a draggable settings panel
- Responsive design for various screen sizes

## Installation

1. Install a userscript manager (e.g., Tampermonkey)
2. Copy the script code
3. Create a new userscript in your manager and paste the code
4. Save and enable the script

Enhance your browsing experience with Link Editor's customizable link management!
