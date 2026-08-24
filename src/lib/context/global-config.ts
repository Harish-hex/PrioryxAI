export type TermSystem = 'semester' | 'quarter' | 'trimester' | 'modular';
export type GradingSystem = 'cgpa_10' | 'gpa_4' | 'percentage' | 'honors' | 'pass_fail';

export interface AcademicSystemConfig {
  key: string;
  country: string;
  termSystem: TermSystem;
  gradingSystem: GradingSystem;
  defaultTimezone: string;
  defaultLocale: string;
  defaultCurrency: string;
  examTerms: string[];
  recruitmentPeriods: string[];
}

export const ACADEMIC_SYSTEMS: Record<string, AcademicSystemConfig> = {
  india_semester: {
    key: 'india_semester',
    country: 'IN',
    termSystem: 'semester',
    gradingSystem: 'cgpa_10',
    defaultTimezone: 'Asia/Kolkata',
    defaultLocale: 'en-IN',
    defaultCurrency: 'INR',
    examTerms: ['internal', 'external', 'mid_term', 'end_sem', 'quiz', 'lab', 'assignment'],
    recruitmentPeriods: ['summer_internship', 'placement_season'],
  },
  us_semester: {
    key: 'us_semester',
    country: 'US',
    termSystem: 'semester',
    gradingSystem: 'gpa_4',
    defaultTimezone: 'America/New_York',
    defaultLocale: 'en-US',
    defaultCurrency: 'USD',
    examTerms: ['midterm', 'final', 'quiz', 'assignment', 'lab'],
    recruitmentPeriods: ['fall_recruiting', 'spring_recruiting', 'summer_internship'],
  },
  uk_terms: {
    key: 'uk_terms',
    country: 'GB',
    termSystem: 'trimester',
    gradingSystem: 'percentage',
    defaultTimezone: 'Europe/London',
    defaultLocale: 'en-GB',
    defaultCurrency: 'GBP',
    examTerms: ['coursework', 'exam', 'practical', 'assessment'],
    recruitmentPeriods: ['graduate_scheme', 'summer_internship'],
  },
};

export function normalizeCountryCode(country?: string | null): string | null {
  if (!country) return null;
  const normalized = country.trim().toUpperCase();
  if (normalized === 'UK') return 'GB';
  if (normalized === 'UNITED KINGDOM') return 'GB';
  if (normalized === 'UNITED STATES') return 'US';
  if (normalized === 'USA') return 'US';
  if (normalized === 'INDIA') return 'IN';
  return normalized;
}

export function resolveAcademicSystem(system?: string | null, country?: string | null): AcademicSystemConfig {
  if (system && ACADEMIC_SYSTEMS[system]) return ACADEMIC_SYSTEMS[system];
  const normalizedCountry = normalizeCountryCode(country);
  const byCountry = Object.values(ACADEMIC_SYSTEMS).find((cfg) => cfg.country === normalizedCountry);
  return byCountry ?? ACADEMIC_SYSTEMS.india_semester;
}

export function getDefaultLocaleContext(country?: string | null, academicSystem?: string | null) {
  const normalizedCountry = normalizeCountryCode(country);
  const cfg = resolveAcademicSystem(academicSystem, normalizedCountry);
  return {
    country: normalizedCountry || cfg.country,
    timezone: cfg.defaultTimezone,
    locale: cfg.defaultLocale,
    currency: cfg.defaultCurrency,
    academicSystem: cfg.key,
    termSystem: cfg.termSystem,
    gradingSystem: cfg.gradingSystem,
  };
}
