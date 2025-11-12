// Type definitions for Insight Studio

export type UserRole = 'family_member' | 'trustee' | 'advisor';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

export type Generation = 'GenX' | 'Millennial' | 'GenZ' | 'Boomer';

export type SophisticationLevel = 'beginner' | 'intermediate' | 'advanced';

export type BriefingType = 'market' | 'portfolio';

export type InterestLevel = 'low' | 'medium' | 'high';

export interface Tenant {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  domain?: string;
}

export interface User {
  id: string;
  tenantId: string;
  azureAdId: string;
  email: string;
  role: UserRole;
  language: Language;
  generation?: Generation;
  sophisticationLevel?: SophisticationLevel;
  preferences: Record<string, any>;
}

export interface Briefing {
  id: string;
  userId: string;
  tenantId: string;
  type: BriefingType;
  content: string;
  generatedAt: Date;
  weekStartDate: Date;
}

export interface Explainer {
  id: string;
  tenantId: string;
  topic: string;
  content: string;
  language: Language;
  generatedAt: Date;
  cached: boolean;
}

export interface Lesson {
  id: string;
  tenantId: string;
  topic: string;
  content: string;
  generation?: Generation;
  language: Language;
  sophisticationLevel?: SophisticationLevel;
  generatedAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  topic: string;
  interestLevel: InterestLevel;
}

export interface PortfolioData {
  holdings: Array<{
    symbol?: string;
    name: string;
    value: number;
    percentage: number;
    assetClass?: string;
  }>;
  totalValue: number;
  lastUpdated: Date;
}

