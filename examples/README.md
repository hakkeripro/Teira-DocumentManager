# TEIRA examples (Sprint 2)

This folder contains sample import files matching `docs/mapping/MappingSpec.yaml`.

## Files
- `TEIRA_Example_Import.xlsx`
  - Sheets: `DEVICE_LIST`, `PULL_LIST`, `TEST_LIST`, `WIRING_DIAGRAMS` (+ optional `META`).
  - Import UI expects you to choose **docType** and upload the XLSX.
- `DEVICE_LIST_example.xml`
  - Root path: `DeviceList.Devices.Device`
- `PULL_LIST_example.xml`
  - Root path: `PullList.Cables.Cable`
- `WIRING_DIAGRAMS_ObjectSet_example.xml`
  - ObjectSet XML: `ObjectSet.Export...Objects.OI` (modules) -> nested `OI` (points)
  - Import UI: choose `WIRING_DIAGRAMS` and upload the XML

## How to test
1. Create an Area + Project
2. Open the project, pick/create a Center
3. Go to **Import / Export**
4. Choose docType (e.g. `DEVICE_LIST`) and upload a matching file
5. Run **Dry-run preview** then **Commit import**
6. Check **Import runs** and **Documents** pages
