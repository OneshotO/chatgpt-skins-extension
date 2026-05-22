# ChatGPT Skins

A simple browser extension for customizing the ChatGPT interface.

I originally built this for myself because I wanted ChatGPT to be easier to read: bigger text, wider answers, and a few visual customizations. I decided to share it in case it is useful for other people too.

> This is an unofficial project and is not affiliated with OpenAI.

## Why I made this

Sometimes the default ChatGPT layout feels too narrow or the text feels small, especially when reading long answers, studying, coding, or using a large monitor.

This extension lets you quickly adjust the interface without changing your browser zoom or system settings.

## Features

- Increase or decrease chat message font size
- Make the ChatGPT content area wider
- Change the accent color
- Change chat text color
- Choose between different visual themes
- Eye protection theme with more comfortable reading defaults
- Reset customizations with one button
- Saves your preferences using Chrome storage

## Available themes

- Default
- Dark
- Neon
- Eye Protection
- Rick & Morty

## Installation

This extension is not published on the Chrome Web Store. You can install it manually:

1. Download or clone this repository.
2. Open Chrome or Brave.
3. Go to:

   ```text
   chrome://extensions/
   ```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project folder.
7. Open ChatGPT and click the extension icon to customize the UI.

## Usage

After installing the extension:

1. Open [ChatGPT](https://chatgpt.com).
2. Click the **ChatGPT Skins** extension icon.
3. Choose a theme.
4. Adjust font size, content width, accent color, or chat text color.
5. Your settings are saved automatically.

## Notes

ChatGPT’s interface changes from time to time, so some CSS selectors may stop working in the future. If something breaks, it may need a small update.

The extension currently supports:

```text
https://chat.openai.com/*
https://chatgpt.com/*
```

## Privacy

This extension does not collect, send, or store your conversations.

It only uses Chrome storage to save your local customization settings, such as selected theme, font size, content width, and colors.

## Disclaimer

This is a small personal project shared for convenience. It is not an official OpenAI or ChatGPT product.

## License

All rights reserved.

You may use this project for personal use, but you may not redistribute, republish, sell, or use it as the base for another public project without permission.
