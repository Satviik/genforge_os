export type NetworkNodeKind =
  | "hub"
  | "team"
  | "customer"
  | "product"
  | "order"
  | "channel"
  | "expense"
  | "production"
  | "material"
  | "revenue"
  | "profit";

export type NetworkNodeData = {
  kind: NetworkNodeKind;
  label: string;
  subtitle?: string;
  metrics?: Record<string, string | number>;
  searchText: string;
};

export type NetworkGraphNode = {
  id: string;
  type: "network";
  position: { x: number; y: number };
  data: NetworkNodeData;
};

export type NetworkGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  kind: "relationship" | "derived";
};

export type NetworkGraphResponse = {
  nodes: NetworkGraphNode[];
  edges: NetworkGraphEdge[];
  generatedAt: string;
};
