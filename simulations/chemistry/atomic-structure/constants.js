/**
 * Vinit Simulation Hub — shared Physics & Chemistry constants.
 * Values are SI constants at commonly useful precision.
 * The wavelength-energy shortcut uses the conventional rounded value 1240 eV·nm.
 */

export const PLANCK_CONSTANT = 6.62607015e-34; // J·s (exact)
export const SPEED_OF_LIGHT = 299792458; // m·s⁻¹ (exact)
export const ELECTRON_MASS = 9.1093837139e-31; // kg
export const ELEMENTARY_CHARGE = 1.602176634e-19; // C (exact)
export const RYDBERG_CONSTANT = 1.0973731568157e7; // m⁻¹
export const BOHR_RADIUS = 5.29177210544e-11; // m

/** Approximate hc/e conversion factor for E(eV) = 1240 / λ(nm). */
export const EV_NM_CONVERSION = 1240; // eV·nm

/**
 * Returns photon energy in electron-volts using the 1240 eV·nm shortcut.
 * @param {number} wavelengthNm Wavelength in nanometres; must be positive.
 * @returns {number} Photon energy in eV.
 */
export function photonEnergyEV(wavelengthNm) {
  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
    throw new RangeError('Wavelength must be a finite number greater than 0 nm.');
  }
  return EV_NM_CONVERSION / wavelengthNm;
}

/** Immutable namespaced view for consumers that prefer a single constants object. */
export const PHYSICAL_CONSTANTS = Object.freeze({
  planck: PLANCK_CONSTANT,
  speedOfLight: SPEED_OF_LIGHT,
  electronMass: ELECTRON_MASS,
  elementaryCharge: ELEMENTARY_CHARGE,
  rydberg: RYDBERG_CONSTANT,
  bohrRadius: BOHR_RADIUS,
  evNmConversion: EV_NM_CONVERSION
});
