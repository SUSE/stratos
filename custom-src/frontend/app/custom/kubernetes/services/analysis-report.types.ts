export enum ResourceAlertLevel {
  OK = 1,
  Info,
  Warning,
  Error,
  Unknown,
}

// We er-map an analysis reprot into a map of resource alerts that is better for us
// to overlay in the UI to show issues from reports
export interface ResourceAlert {
  apiVersion?: string;
  kind: string;
  message: string;
  namespace: string;
  name: string;
  level: ResourceAlertLevel;
}

export interface ResourceAlertMap {
  [key: string]: ResourceAlert[];
}
