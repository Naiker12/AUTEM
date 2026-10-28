export const PASSWORD_RULES = [
  { label: "12 caracteres como mínimo", test: (value: string) => value.length >= 12 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
  { label: "Un símbolo", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export type EvaluatedPasswordRule = {
  label: string;
  complete: boolean;
};

export function getPasswordStrength(completedRules: number) {
  if (completedRules <= 1) return { label: "Aún no es segura", value: 20 };
  if (completedRules <= 3) return { label: "Puede mejorar", value: 55 };
  if (completedRules === 4) return { label: "Casi lista", value: 80 };
  return { label: "Contraseña segura", value: 100 };
}

export function evaluatePasswordRules(password: string) {
  const rules: EvaluatedPasswordRule[] = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    complete: rule.test(password),
  }));
  const completedRules = rules.filter((rule) => rule.complete).length;
  const isSecure = completedRules === PASSWORD_RULES.length;
  const strength = getPasswordStrength(completedRules);

  return {
    rules,
    completedRules,
    isSecure,
    strength,
  };
}
