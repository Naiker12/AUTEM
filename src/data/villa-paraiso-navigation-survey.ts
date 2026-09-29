/**
 * Findings extracted from the source CAD. CAD positions cannot be drawn over the SVG or
 * used as GPS coordinates until the field calibration is completed.
 */
export const villaParaisoNavigationSurvey = {
  source: "VILLA PARAISO_05092026_CAMPO.dxf",
  primaryEntrance: {
    label: "ACCESO PRINCIPAL",
    cadPoint: { x: 859894.9872612, y: 1645954.774992162 },
    status: "cad_identified_requires_field_validation" as const,
  },
  requiredControlPoints: 4,
  controlPoints: [],
} as const;
