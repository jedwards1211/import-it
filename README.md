# import-it package

Automatically adds `require` and `import` statements for undeclared identifiers to Javascript and/or Flow,
using [`dude-wheres-my-module`](https://github.com/jedwards1211/dude-wheres-my-module).

Just use the `⌃⌘I` shortcut in the editor for the file you want to add imports to.

For more information on customization, see https://github.com/jedwards1211/dude-wheres-my-module#configuration

![Screenshot](screenshot.png?raw=true 'Screenshot')

# Troubleshooting

You can view the imports server log file with the `Import It: Open imports server log file` command.
If the server seems to be messed up, you can stop it with the `Import It: Stop imports server` or `Import It: Hard kill imports server` commands.

You can also install the `dude-wheres-my-module` package and use its CLI commands in your project directory.
For example if you run `dude wheres React` and it responds with `import * as React from 'react'`, but this extension
isn't working, there may be a bug in this extension.
