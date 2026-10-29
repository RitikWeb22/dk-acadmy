/**
 * DK Academy JEE - Academic Session & Target Year Derivation Utility
 * Pure functions to map current class/stage to valid JEE target year.
 */

export const CURRENT_ACADEMIC_SESSION = 2026; // 2026-2027 Academic Session

/**
 * Derives the target JEE exam year based on the student's current class/stage
 * and the active academic session year.
 *
 * Rules:
 * - Class 10th Foundation -> JEE 2029 (session + 3)
 * - Class 11th -> JEE 2028 (session + 2)
 * - Class 12th -> JEE 2027 (session + 1)
 * - Dropper & Repeater -> JEE 2027 (session + 1)
 */
export function getTargetYear(currentClass: string, sessionYear: number = CURRENT_ACADEMIC_SESSION): string {
  switch (currentClass) {
    case 'Class 10th Foundation':
      return String(sessionYear + 3); // 2029
    case 'Class 11th':
      return String(sessionYear + 2); // 2028
    case 'Class 12th':
      return String(sessionYear + 1); // 2027
    case 'Dropper & Repeater':
    case 'Dropper':
      return String(sessionYear + 1); // 2027
    default:
      return String(sessionYear + 1);
  }
}

/**
 * Returns valid target years for a given class stage.
 */
export function getValidTargetYears(currentClass: string, sessionYear: number = CURRENT_ACADEMIC_SESSION): string[] {
  const primary = parseInt(getTargetYear(currentClass, sessionYear), 10);
  return [String(primary), String(primary + 1)];
}
