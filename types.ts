export type CellValue = string | number | boolean | Date | null | undefined;

export interface DataRow {
  [key: string]: CellValue;
}

export enum ColumnType {
  STRING = 'String',
  NUMBER = 'Number',
  DATE = 'Date',
  BOOLEAN = 'Boolean',
  UNKNOWN = 'Unknown'
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
  min?: number | Date;
  max?: number | Date;
  mean?: number;
  sum?: number;
  outliers?: number; // count of simple IQR outliers
  exampleValues: CellValue[];
}

export interface DataSet {
  fileName: string;
  rows: DataRow[];
  columns: ColumnProfile[];
  rowCount: number;
  primaryDateColumn?: string;
  primaryMeasureColumn?: string;
  dimensions: string[]; // text columns suitable for grouping
}

// New types for Multi-sheet modeling
export interface Table extends DataSet {
  id: string; // usually the sheet name
  tableName: string;
}

export type TableCollection = Record<string, Table>;

export interface JoinConfig {
  id: string;
  rightTableId: string;
  leftColumn: string; // Column from the accumulated dataset (or base table)
  rightColumn: string; // Column from the new table being joined
  joinType: 'LEFT' | 'INNER';
}

export interface DataModel {
  baseTableId: string;
  joins: JoinConfig[];
}

export interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  selectedDimension: string | null;
  selectedCategory: string | null;
}

export type Language = 'en' | 'pt';