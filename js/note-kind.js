// This goes in its own file so that achievements.js and logic.js can share note kinds without circular imports.
export const NoteKind = Object.freeze({
  VALUE: "value",
  POINTER: "pointer",
  ARRAY: "array",
});
