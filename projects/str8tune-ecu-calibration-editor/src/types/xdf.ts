// XDF File Format Type Definitions

export interface XDFDefaults {
  datasizeinbits: number;
  sigdigits: number;
  outputtype: number;
  signed: number;
  lsbfirst: number;
  float: number;
}

export interface XDFCategory {
  index: number;
  name: string;
}

export interface XDFRegion {
  type: string;
  startaddress: string;
  size: string;
  regionflags: string;
  name: string;
  desc: string;
}

export interface XDFHeader {
  flags?: string;
  description?: string;
  DEFAULTS?: XDFDefaults;
  REGION?: XDFRegion;
  CATEGORY?: XDFCategory[];
}

export interface EmbeddedData {
  mmedtypeflags?: string;
  mmedaddress?: string; // Hex string like "0x70B7D2"
  mmedelementsizebits?: number; // 8, 16, or 32
  mmedrowcount?: number;
  mmedcolcount?: number;
  mmedmajorstridebits?: number;
  mmedminorstridebits?: number;
}

export interface MathVar {
  id: string;
}

export interface MathEquation {
  equation: string; // e.g., "X*0.1", "X*1", "X"
  VAR: MathVar;
}

export interface XDFLabel {
  index: number;
  value: string;
}

export interface DALink {
  index: number;
}

export interface EmbedInfo {
  type: number;
}

export interface XDFAxis {
  id: 'x' | 'y' | 'z';
  uniqueid?: string;
  EMBEDDEDDATA?: EmbeddedData;
  units?: string;
  indexcount?: number;
  decimalpl?: number;
  datatype?: number;
  unittype?: number;
  embedinfo?: EmbedInfo;
  DALINK?: DALink[];
  LABEL?: XDFLabel[];
  MATH?: MathEquation;
  min?: string;
  max?: string;
  outputtype?: number;
}

export interface CategoryMem {
  index: number;
  category: number;
}

export interface XDFTable {
  uniqueid?: string;
  flags?: string;
  title: string;
  description?: string;
  CATEGORYMEM?: CategoryMem[];
  XDFAXIS: XDFAxis[];
}

export interface XDFFormat {
  version: string;
  XDFHEADER: XDFHeader;
  XDFTABLE?: XDFTable[];
}

// Parsed/processed types for easier use in the app
export interface ParsedTable {
  id: string;
  title: string;
  description?: string;
  categories: number[];
  xAxis: ParsedAxis;
  yAxis: ParsedAxis;
  zAxis: ParsedAxis;
  address?: number; // Parsed hex address as decimal
  elementSizeBits: number;
  rowCount: number;
  colCount: number;
  majorStrideBits: number;
  minorStrideBits: number;
  mathEquation?: string;
  units?: string;
  decimalPlaces: number;
  min?: number;
  max?: number;
}

export interface ParsedAxis {
  address?: number; // Parsed hex address as decimal
  elementSizeBits: number;
  count: number;
  labels?: number[];
  mathEquation?: string;
  units?: string;
  decimalPlaces: number;
  embedded: boolean; // Whether axis data is embedded in BIN
}

