export interface BeforeAfterSliderProps {
  /** Source URL for the "Before" (antes) image */
  beforeSrc: string;
  /** Source URL for the "After" (después) image */
  afterSrc: string;
  /** Alt text for the "Before" image */
  beforeAlt?: string;
  /** Alt text for the "After" image */
  afterAlt?: string;
  /** Label tag for the "Before" image (defaults to "Antes") */
  beforeLabel?: string;
  /** Label tag for the "After" image (defaults to "Después") */
  afterLabel?: string;
  /** Initial slider position from 0 to 100 (defaults to 50) */
  initialPosition?: number;
  /** Whether to perform the welcome auto-sweep animation on first view (defaults to true) */
  autoSweep?: boolean;
  /** Optional container CSS classes */
  className?: string;
}
