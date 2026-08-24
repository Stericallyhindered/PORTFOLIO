# Calibration fixtures

Downloaded calibration definitions, firmware images, and vehicle logs are kept under
`fixtures/local/` and are intentionally excluded from Git. These files may contain
third-party intellectual property or customer/vehicle data.

Committed manifests under `fixtures/manifests/` identify each local fixture by SHA-256,
source, and compatibility relationship. A fixture is usable for development only when
its computed hash matches its manifest.

No fixture manifest grants redistribution rights. Before publishing any fixture, record
an explicit license or written permission from its owner.

