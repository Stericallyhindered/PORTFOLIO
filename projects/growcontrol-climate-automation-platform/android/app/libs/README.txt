Place your Tuya App SDK security bundle here (any `*.aar` name works — Gradle uses
`implementation fileTree(..., dir: 'libs')`):

  security-algorithm.aar
  or e.g. security-algorithm-1.0.0-beta.aar

Download from https://platform.tuya.com/ → SDK Development → Get SDK → build/download
Android package, extract, and copy the security `.aar` into **android/app/libs/**
(not the project root — Gradle does not read `libs` from repo root).

Without this file, native Tuya initialization may fail at runtime even if
dart-define keys are correct.
