---
title: Shipping GNOME apps for Linux, macOS and Windows with gjsify
date: 2026-11-01
summary: gjsify ship builds packages for Linux, macOS and Windows from your app. For the Mac it now also signs and notarises, with one command and no packaging files in your repo.
tags: [gjsify, macOS]
---

Writing an app is one half of the job, getting it to run on other people's machines is the other.
With `gjsify ship` you build installable packages from your project, with no packaging files in
the repo and no hand-driven `dpkg-deb`, `rpmbuild` or `hdiutil`. What is new: for macOS, `ship` now
also **signs and has Apple notarise** the result. I used it for three apps:
[Learn 6502 Assembly](https://github.com/JumpLink/easy6502),
[Steuererklärung](https://github.com/JumpLink/steuererklaerung) and
[Beifahrer](https://github.com/JumpLink/beifahrer). All three now ship as a dmg for Apple Silicon
and for Intel, and macOS opens them without a warning.

## One command per operating system

`ship` runs your project's `build` script, assembles one payload and wraps it per format. For Linux
it works out which libraries a distribution needs by reading your bundle. The settings live in a
`gjsify.ship` block in your `package.json`.

```sh
gjsify ship linux --target deb,rpm,appimage
gjsify ship darwin --arch arm64 --target macos-app-zip,macos-app-dmg
```

Linux gets `.deb`, `.rpm` and AppImage. For the Mac you get an `.app` as a `.zip` and as a `.dmg`,
one architecture per run. The apps carry their own runtime, so whoever downloads one needs neither
GJS nor GTK installed. Windows gets an MSI installer, which I do not sign yet; more on that below.

## Signing and notarising

Without a signature macOS will not open a downloaded app, because Gatekeeper rejects anything
carrying the browser's quarantine flag. You need three things:

- a membership in the Apple Developer Program,
- a certificate of the type *Developer ID Application* in your keychain,
- a credential for `notarytool`, for example an App Store Connect API key, stored as a profile with
  `xcrun notarytool store-credentials`.

Then two flags come on top:

```sh
gjsify ship darwin --arch arm64 --target macos-app-dmg \
  --sign "Developer ID Application: Your Name (TEAMID)" \
  --notarize my-notary-profile
```

`--sign` signs every executable image in the app, and the dmg image as well. `--notarize` sends
the result to Apple, waits for the verdict and staples the ticket to the file. Without an identity
`ship` packs unsigned and says so loudly. There is no silent "signed".

In CI this runs on a Mac runner. Certificate and API key sit in the repository as secrets, and the
job imports them into a throwaway keychain. Each of my apps carries five secrets, and CI builds the
releases. Afterwards the job checks every architecture with `codesign --verify`, `spctl` with the
quarantine flag set, and `stapler validate`.

## What I learned along the way

I found the stumbling block with Steuererklärung, and it was in the tooling, not in the app: the
umlaut in the name invalidated the signature. `codesign` derives the identifier of the bundled
interpreter from its file name, and the dmg stores names in a different decomposed form than the one
the seal was computed with. The `.zip` was fine, the same app inside the mounted dmg was not.
Notarisation and `stapler validate` still pass, and only Gatekeeper rejects the app at launch.
`ship` now handles both
([#2466](https://github.com/gjsify/gjsify/pull/2466),
[#2480](https://github.com/gjsify/gjsify/pull/2480), included since gjsify 0.64.14), and a test
mounts a dmg with an umlaut in the file names and verifies the signature inside it. You need to do
nothing about it, not even for a name like "Steuererklärung".

The lesson holds for every release: check the finished dmg on a real Mac. I use the MacBook for
arm64 and a macOS VM for Intel. Both get the quarantine flag as after a browser download, then
`spctl` and `codesign --verify --deep --strict` on the app inside the mounted image. A green CI
alone would not have shown the bug.

## And Windows?

`ship` already builds the MSI, and CI installs and starts it as a test. It is unsigned, though, and
Windows warns about it. The certificate from Microsoft is still pending, and the CI wiring follows.

More on the formats is in the guide [Ship your app](https://gjsify.org/gjsify/ship/).
