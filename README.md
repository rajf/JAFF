# JAFF
## Just Another Front-end Framework

Inspired by [Assemble.io](http://assemble.io/) and other flat file content editors.

>Features:
>- Yaml for data
>- Markdown for content blocks
>- Twig for templating
>- Gulp for build

## Install
- Run npm install

## Notes
### app/data
For YAML files. YAML used for ease of editing. This is parsed to JSON in the build so could be replaces quite easily with pure JSOn files if you prefer.
### app/data/global.yaml
Anything in here is available to all templates. Good for menus, lists, etc. See gulp file for mplimentation.

### app/content
For your Markdown files.

### app/pages
The scructure and naming of files in this folder determines your site structure.

### Confguration
Custom paths can be configured in Gulp file.

## TODO
- Possibly recursivly check for imports but may be overkill