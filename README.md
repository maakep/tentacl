# tentacl

A tool for automatic building & deploying your npm-based project.

## Prerequsites
- Nodejs
- Your project is set up with `npm run build` & `npm run server`
- Configure your github repository and create a webhook that post tags to your tentacl web server

## Setting up


Your device

  ├─ your-project

  └─ tentacl

## Running
> node /tentacl/index.js ../your-project

## Docs
Create releases through github or create & push tags yourself. The version semantic should follow semver.org: v0.0.0; major.minor.patch
tentalc is configured to 
- patch:
  - pull
- minor:
  - pull & build
- major:
  - pull & build & restart server
