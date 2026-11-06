// Types for Reinforced Concrete Design according to SNI 2847:2013 and Agus Setiawan textbook

export type ConcreteSectionType = 'rectangular_single' | 'rectangular_double' | 't_beam' | 'l_beam';

export interface ConcreteMaterial {
  fc: number;  // Kuat tekan silinder beton (MPa)
  fy: number;  // Kuat leleh tulangan baja lentur (MPa)
  fyt: number; // Kuat leleh tulangan sengkang/geser (MPa)
  lambda: number; // Faktor beton ringan (1.0 = normal, 0.85 = pasir ringan, 0.75 = ringan total)
  Es: number;  // Modulus elastisitas baja (200,000 MPa)
}

export interface RebarBarOption {
  diameter: number; // mm
  area: number;     // mm2: 0.25 * PI * d^2
  label: string;    // e.g. 'D16', 'D19', 'D22', 'D25', 'D29', 'D32'
}

// Available standard rebar in Indonesian Civil Engineering practice
export const STANDARD_REBARS: RebarBarOption[] = [
  { diameter: 10, area: 78.54, label: 'D10' },
  { diameter: 12, area: 113.10, label: 'D12' },
  { diameter: 13, area: 132.73, label: 'D13' },
  { diameter: 16, area: 201.06, label: 'D16' },
  { diameter: 19, area: 283.53, label: 'D19' },
  { diameter: 22, area: 380.13, label: 'D22' },
  { diameter: 25, area: 490.87, label: 'D25' },
  { diameter: 29, area: 660.52, label: 'D29' },
  { diameter: 32, area: 804.25, label: 'D32' },
  { diameter: 36, area: 1017.88, label: 'D36' },
];

export interface ConcreteBeamGeometry {
  sectionType: ConcreteSectionType;
  b: number;      // Lebar balok persegi / lebar sayap (mm)
  h: number;      // Tinggi total penampang (mm)
  d?: number;     // Tinggi efektif serat tekan ke pusat tulangan tarik (mm)
  cover: number;  // Selimut beton bersih (mm, default 40mm)
  // For T-Beam & L-Beam
  bw?: number;    // Lebar badan balok (mm)
  hf?: number;    // Tebal pelat sayap (mm)
  spanLength?: number; // Panjang bentang balok (m) untuk menghitung lebar efektif be
  spacingCenterToCenter?: number; // Jarak as ke as balok (m)
  clearWebDistance?: number;      // Jarak bersih antar badan balok (m)
  isInteriorBeam?: boolean;       // T-beam (true) or L-beam (false)
  isIsolated?: boolean;           // Balok T tunggal / monolit
}

export interface FlexureAnalysisInput {
  geometry: ConcreteBeamGeometry;
  material: ConcreteMaterial;
  // Tension rebar
  tensionBars: {
    count: number;
    diameter: number;
    layers: number; // 1 or 2 layers
  };
  // Compression rebar (if double reinforced)
  compressionBars?: {
    count: number;
    diameter: number;
    dPrime: number; // Jarak serat tekan ke pusat tulangan tekan (mm, default 60-70mm)
  };
  stirrupDiameter?: number;
  Mu_applied?: number; // Momen lentur terfaktor eksternal (kN.m)
}

export interface FlexureAnalysisOutput {
  As: number;       // Luas tulangan tarik total (mm2)
  AsPrime: number;  // Luas tulangan tekan (mm2)
  d: number;        // Tinggi efektif aktual (mm)
  dPrime: number;   // Jarak tulangan tekan (mm)
  beta1: number;    // Faktor distribusi blok tegangan Whitney (Eq. 3.5)
  rho: number;      // Rasio tulangan tarik As / (b*d)
  rhoPrime: number; // Rasio tulangan tekan As' / (b*d)
  rhoBalance: number; // Rasio kondisi seimbang (Eq. 3.13)
  rhoMaxTension: number; // Rasio batas maksimum penampang terkendali tarik (eps_t = 0.005) (Eq. 3.24)
  rhoMaxTransition: number; // Rasio batas maksimum transisi (eps_t = 0.004) (Eq. 3.25)
  rhoMin: number;   // Rasio tulangan minimum (Eq. 3.26 / 3.27)
  AsMin: number;    // Luas tulangan minimum (mm2)
  a: number;        // Tinggi blok tegangan Whitney (mm)
  c: number;        // Kedalaman garis netral dari serat tekan (mm)
  eps_t: number;    // Regangan tarik netto tulangan terluar
  eps_s_prime?: number; // Regangan tulangan tekan
  fs_prime?: number;    // Tegangan aktual tulangan tekan (MPa)
  isCompressionYielded?: boolean;
  phi: number;      // Faktor reduksi kekuatan phi (0.65 - 0.90)
  Mn: number;       // Kuat momen lentur nominal (kN.m)
  phiMn: number;    // Kuat momen lentur rencana (kN.m)
  Mu_applied: number; // Momen perlu Mu (kN.m)
  isAdequate: boolean; // phiMn >= Mu
  failureType: 'Tension Controlled (Terkendali Tarik)' | 'Transition Zone (Daerah Transisi)' | 'Compression Controlled (Terkendali Tekan)';
  tBeamCase?: 'Case 1 (a <= hf, Berperilaku Persegi)' | 'Case 2 (a > hf, Berperilaku Penampang T Murni)';
  effectiveFlangeWidth?: number; // be (mm)
  steps: Array<{
    title: string;
    formula: string;
    substitution: string;
    result: string;
    explanation: string;
  }>;
}

export interface FlexureDesignInput {
  sectionType: ConcreteSectionType;
  Mu: number;       // Momen perlu terfaktor (kN.m)
  material: ConcreteMaterial;
  cover: number;    // mm (default 40)
  stirrupDiameter: number; // mm (default 10)
  preferredBarDiameter: number; // mm (e.g. 22 or 25)
  // Optional fixed dimensions
  b?: number;       // Lebar balok yang diinginkan (mm)
  h?: number;       // Tinggi total balok yang diinginkan (mm)
  // T-beam specifics
  bw?: number;
  hf?: number;
  spanLength?: number;
  clearWebDistance?: number;
  isInteriorBeam?: boolean;
}

export interface DesignAlternative {
  id: string;
  name: string;
  b: number;
  h: number;
  d: number;
  dPrime?: number;
  reinforcementType: 'Singly Reinforced' | 'Doubly Reinforced';
  tensionBarSummary: string; // e.g. "4D25 (As = 1963.5 mm²)"
  tensionBarsCount: number;
  tensionBarDiameter: number;
  layers: number;
  compressionBarSummary?: string; // e.g. "2D19 (As' = 567.1 mm²)"
  compressionBarsCount?: number;
  compressionBarDiameter?: number;
  phiMn: number; // kN.m
  efficiencyRatio: number; // Mu / phiMn (0.75 - 0.98 is great)
  concreteVolumeRel: number;
  steelWeightRel: number;
  isCompliant: boolean;
  reasons: string[];
}

export interface FlexureDesignOutput {
  Mu: number;
  material: ConcreteMaterial;
  recommendedDimensions: {
    b: number;
    h: number;
    d: number;
  };
  designModeRequired: 'Singly Reinforced' | 'Doubly Reinforced Required' | 'T-Beam Flanged Action';
  alternatives: DesignAlternative[];
  chosenDesign: DesignAlternative;
  steps: Array<{
    title: string;
    formula: string;
    substitution: string;
    result: string;
    explanation: string;
  }>;
}

export interface ShearDesignInput {
  Vu: number;       // Gaya geser terfaktor pada penampang kritis (kN)
  bw: number;       // Lebar badan balok (mm)
  d: number;        // Tinggi efektif balok (mm)
  h: number;        // Tinggi balok total (mm)
  material: ConcreteMaterial;
  stirrupDiameter: number; // mm (typically 10 or 13)
  legsCount: number;       // Jumlah kaki sengkang (typically 2, 3, or 4)
  beamSpanL?: number;      // Bentang total balok (m)
  qu?: number;             // Beban merata terfaktor jika ingin menghitung variasi jarak (kN/m)
  supportWidth?: number;   // Lebar tumpuan / kolom (mm, default 300-400mm)
}

export interface StirrupArrangement {
  diameter: number;
  spacing: number;
  legs: number;
  zone: string; // e.g. "Daerah Tumpuan (0 hingga 2h)" or "Daerah Lapangan"
  rangeFrom: number; // m
  rangeTo: number;   // m
  quantity: number;
}

export interface ShearDesignOutput {
  Vu: number;              // kN
  phi: number;             // 0.75
  Vc: number;              // Kuat geser beton nominal (kN)
  phiVc: number;           // Kuat geser beton tereduksi (kN)
  halfPhiVc: number;       // 0.5 * phi * Vc (kN)
  Vs_required: number;     // Kuat geser tulangan yang diperlukan (kN)
  Vs_max_limit: number;    // Batas maksimum Vs = 0.66 * sqrt(f'c) * bw * d (kN)
  isSectionAdequate: boolean; // Vs <= Vs_max_limit
  shearRequirementType: 'No Shear Reinforcement Required' | 'Minimum Shear Reinforcement' | 'Calculated Shear Reinforcement';
  Av: number;              // Luas tulangan sengkang = legsCount * 0.25 * PI * d^2 (mm2)
  s_calculated: number;    // Jarak sengkang hitungan (mm)
  s_max_code: number;      // Jarak sengkang maksimum menurut SNI (mm)
  s_selected_support: number; // Jarak sengkang rekomendasi daerah tumpuan (mm)
  s_selected_field: number;   // Jarak sengkang rekomendasi daerah lapangan (mm)
  zones: StirrupArrangement[];
  totalStirrupCount: number;
  longitudinalSuspenderBars: string; // e.g. "2D13 (tulangan perakit sisi atas)"
  steps: Array<{
    title: string;
    formula: string;
    substitution: string;
    result: string;
    explanation: string;
  }>;
}

// -------------------------------------------------------------
// AUTO-OPTIMIZER TYPES (SNI 2847:2013 & AGUS SETIAWAN TEXTBOOK)
// -------------------------------------------------------------
export type OptimizationObjective =
  | 'balanced_cost'    // Paling Ekonomis (Kombinasi Beton + Baja Seimbang)
  | 'min_concrete'     // Volume Beton Minimum (Penampang Ramping)
  | 'min_height'       // Tinggi Minimum Arsitektural (Low Clearance)
  | 'constructability'; // Praktis Lapangan (Spasi lega, 1 lapis, tulangan standar)

export type DeflectionSupportCondition =
  | 'simply_supported'      // L / 16
  | 'one_end_continuous'    // L / 18.5
  | 'both_ends_continuous'  // L / 21
  | 'cantilever';           // L / 8

export interface AutoOptimizerInput {
  Mu: number;                 // Bending moment terfaktor Mu (kN.m)
  Vu?: number;                // Shear force terfaktor Vu (kN) (optional, defaults to 0)
  spanLength?: number;        // Bentang balok L (m) untuk kontrol lendutan h_min
  supportCondition?: DeflectionSupportCondition;
  material: ConcreteMaterial;
  cover: number;              // Selimut beton bersih (mm, default 40)
  stirrupDiameter: number;    // Diameter sengkang (mm, default 10)
  // Constraints
  bMin?: number;              // Lebar minimum (mm, default 200)
  bMax?: number;              // Lebar maksimum (mm, default 500)
  hMin?: number;              // Tinggi minimum manual (mm)
  hMax?: number;              // Tinggi maksimum manual / batasan plafon (mm)
  aspectRatioMin?: number;    // Rasio h/b minimum (default 1.25)
  aspectRatioMax?: number;    // Rasio h/b maksimum (default 2.50)
  preferredBarDiameter?: number; // 0 = Bebas / Auto, atau spesifik (misal 19, 22, 25)
  allowDoublyReinforced?: boolean; // Izinkan tulangan rangkap bila tinggi terbatasi
  targetObjective: OptimizationObjective;
}

export interface OptimizedSectionCandidate {
  id: string;
  b: number;                  // mm
  h: number;                  // mm
  d: number;                  // mm
  dPrime?: number;            // mm
  aspectRatio: number;        // h / b
  hMinDeflection: number;     // h_min kontrol lendutan SNI Tabel 9.5(a)
  isDeflectionCompliant: boolean; // h >= hMinDeflection
  reinforcementType: 'Singly Reinforced' | 'Doubly Reinforced';
  // Tension rebar
  tensionBarSummary: string;  // e.g. "4D22"
  tensionCount: number;
  tensionDia: number;
  layers: number;
  clearSpacing: number;       // mm
  As: number;                 // mm²
  // Compression rebar
  compressionBarSummary?: string;
  compressionCount?: number;
  compressionDia?: number;
  AsPrime?: number;           // mm²
  // Code ratios
  rho: number;                // Rasio tulangan aktual
  rhoBalance: number;         // rho_b
  rhoMin: number;             // rho_min
  rhoMaxTension: number;      // rho_maks (eps_t = 0.005)
  rhoRatioToRhoB: number;     // rho / rho_b (ideal 0.35 - 0.50)
  // Capacity & safety
  a: number;                  // Whitney block depth (mm)
  c: number;                  // Neutral axis depth (mm)
  eps_t: number;              // Net tensile strain
  phi: number;                // Reduction factor (0.90 for tension-controlled)
  Mn: number;                 // kN.m
  phiMn: number;              // kN.m
  capacityRatio: number;      // Mu / phiMn (efficiency, e.g. 0.85 - 0.96)
  // Shear check
  Vc: number;                 // kN
  phiVc: number;              // kN
  VsRequired: number;         // kN
  VsMaxLimit: number;         // kN
  isShearFeasible: boolean;   // Vs <= VsMaxLimit
  suggestedStirrup: string;   // e.g. "D10-125 mm"
  // Material consumption & cost metrics
  concreteVolumePerMeter: number; // m³/m
  steelWeightPerMeter: number;    // kg/m (longitudinal + stirrups)
  formworkAreaPerMeter: number;   // m²/m (2*h + b)
  estimatedCostIndex: number;     // Relative synthetic cost score (lower is cheaper)
  constructabilityScore: number;  // 1-100 score based on 1-layer, spacing, standard rebar
  archetypeBadge?: 'Paling Ekonomis' | 'Penampang Ramping' | 'Tinggi Minimum' | 'Praktis Lapangan';
  complianceBadges: string[];
  warnings: string[];
}

export interface AutoOptimizerOutput {
  input: AutoOptimizerInput;
  rhoBalance: number;
  rhoMin: number;
  rhoMaxTension: number;
  RuMax: number;
  bestOverall: OptimizedSectionCandidate;
  archetypes: {
    balancedCost: OptimizedSectionCandidate;
    minConcrete: OptimizedSectionCandidate;
    minHeight: OptimizedSectionCandidate;
    constructability: OptimizedSectionCandidate;
  };
  allCandidates: OptimizedSectionCandidate[];
  totalEvaluated: number;
  totalCompliant: number;
  derivationSteps: Array<{
    title: string;
    formula: string;
    substitution: string;
    result: string;
    explanation: string;
  }>;
}

