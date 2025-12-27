# Welding Utils

> Useful utilities related to welding 🛠️

## Highlights

- Simple API
- 0 runtime dependencies
- Written in TypeScript
- ESM-only (Node.js 24+)
- Tested with Node.js built-in test runner
- Built with plain TypeScript compiler

## Requirements

- Node.js 24 or higher
- ESM-only (no CommonJS support)

## Install

```bash
npm install welding-utils
```

## Usage

```typescript
import { heatInput } from "welding-utils";

const options = {
  voltage: 200,
  amperage: 32,
  efficiencyFactor: 0.8,
  length: 20,
  time: 11,
};

console.log(heatInput(options)); //=> 2.8160000000000003
```

## API

### heatInput(options)

Calculate heat input.

**options**: `HeatInputOptions`

```typescript
interface HeatInputOptions {
  voltage: number;
  amperage: number;
  efficiencyFactor: number;
  length: number;
  time: number;
}
```

**Returns**: `number` - Heat input value

### preheat(options)

Calculate preheat temperature.

**options**: `PreheatOptions`

```typescript
interface PreheatOptions {
  cet: number;
  thickness: number;
  heatInput: number;
  hydrogenLevel: number;
}
```

**Returns**: `number` - Preheat temperature value

### ceq(elements)

Calculate equivalent carbon content (CEQ).

**elements**: `CeqElements`

```typescript
type CeqElements = Omit<Elements, "silicon" | "boron" | "nitrogen">;
```

**Returns**: `number` - Equivalent carbon content (CEQ)

### cet(elements)

Calculate equivalent carbon content (CET).

**elements**: `CetElements`

```typescript
type CetElements = Omit<Elements, "silicon" | "boron" | "nitrogen">;
```

**Returns**: `number` - Equivalent carbon content (CET)

### ceAws(elements)

Calculate equivalent carbon content (CE AWS).

**elements**: `CeAwsElements`

```typescript
type CeAwsElements = Omit<Elements, "boron" | "nitrogen">;
```

**Returns**: `number` - Equivalent carbon content (CE AWS)

### pcm(elements)

Calculate critical metal parameter (PCM).

**elements**: `PcmElements`

```typescript
type PcmElements = Omit<Elements, "nitrogen">;
```

**Returns**: `number` - Critical metal parameter (PCM)

### pren(elements)

Calculate pitting resistance equivalent number (PREN).

**elements**: `PrenElements`

```typescript
type PrenElements = Pick<Elements, "chromium" | "molybdenum" | "nitrogen">;
```

**Returns**: `number` - Pitting resistance equivalent number (PREN)

## Elements Interface

```typescript
interface Elements {
  carbon: number;
  manganese: number;
  chromium: number;
  molybdenum: number;
  vanadium: number;
  nickel: number;
  copper: number;
  silicon: number;
  boron: number;
  nitrogen: number;
}
```

## License

MIT © [Antoni Kępiński](https://www.xxczaki.com)
