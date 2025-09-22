export type AuditReportData = {
    id: string;
    name: string;
    date: string;
    status: string;
    details: string;
};

export type Theme = 'light' | 'dark';

export interface AppState {
    auditData: AuditReportData[] | null;
    theme: Theme;
}