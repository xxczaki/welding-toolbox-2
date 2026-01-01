# react-native-arkit-measurement

ARKit distance measurement module for React Native with Expo. Provides an Apple Measure app-inspired interface for measuring real-world distances using augmented reality.

## Features

- Center crosshair that tilts based on detected surface orientation
- Multi-point measurement with summed total distance
- Live preview line with real-time distance display
- Apple-style coaching overlay for AR calibration
- Liquid glass UI design
- Support for millimeters and inches
- Haptic feedback on point placement

## Requirements

- iOS 13.0+
- Device with ARKit support (iPhone 6s or later)
- Expo SDK 51+

## Installation

```bash
npm install react-native-arkit-measurement
# or
yarn add react-native-arkit-measurement
```

Then run:

```bash
npx expo prebuild
```

## Usage

```typescript
import ARKitMeasurement from 'react-native-arkit-measurement';

// Check if AR is supported
const supported = await ARKitMeasurement.isSupported();

if (supported) {
  // Start measurement (defaults to millimeters)
  const result = await ARKitMeasurement.measureDistance();
  console.log(`Total: ${result.distance} ${result.unit}`);
  console.log(`Segments: ${result.segments}`);

  // Or specify inches
  const resultInches = await ARKitMeasurement.measureDistance({ unit: 'in' });
}
```

## API

### `isSupported(): Promise<boolean>`

Returns whether ARKit measurement is supported on the current device.

### `measureDistance(options?: MeasurementOptions): Promise<MeasurementResult>`

Opens the AR measurement interface and returns the measured distance.

#### MeasurementOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `unit` | `'mm' \| 'in'` | `'mm'` | Unit for display and returned values |

#### MeasurementResult

| Property | Type | Description |
|----------|------|-------------|
| `distance` | `number` | Total measured distance |
| `unit` | `'mm' \| 'in'` | Unit of measurement |
| `segments` | `number[]` | Individual segment distances (for multi-point) |

### Errors

The promise may reject with:

- `USER_CANCELLED` - User dismissed the measurement interface
- `NO_VIEW_CONTROLLER` - Could not find root view controller
- `UNSUPPORTED` - AR measurement requires iOS 13.0 or later

## Android

This module is iOS-only. On Android, `isSupported()` returns `false` and `measureDistance()` rejects with an error.

## License

MIT
