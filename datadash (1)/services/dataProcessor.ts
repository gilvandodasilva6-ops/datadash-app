import * as XLSX from 'xlsx';
import { ColumnProfile, ColumnType, DataSet, CellValue, Table, TableCollection, JoinConfig } from '../types';

/**
 * Parses raw file input into a collection of Tables (one per sheet)
 */
export const processFile = async (file: File): Promise<TableCollection> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        const tables: TableCollection = {};

        // Iterate over ALL sheets
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as any[];

          if (rawRows && rawRows.length > 0) {
            const analyzedData = analyzeSheetData(rawRows, sheetName);
            tables[sheetName] = {
                ...analyzedData,
                id: sheetName,
                tableName: sheetName
            };
          }
        });

        if (Object.keys(tables).length === 0) {
          throw new Error("No valid data found in any sheet.");
        }

        resolve(tables);

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

const analyzeSheetData = (rawRows: any[], fileName: string): DataSet => {
    // 1. Analyze Columns
    const keys = Object.keys(rawRows[0]);
    const columns: ColumnProfile[] = keys.map(key => analyzeColumn(key, rawRows));

    // 2. Heuristics for Auto-detection
    const dateCol = columns.find(c => c.type === ColumnType.DATE && c.uniqueCount > 1)?.name;
    
    // Find best measure: Number type, high variance
    const numberCols = columns.filter(c => c.type === ColumnType.NUMBER);
    numberCols.sort((a, b) => {
            const scoreA = a.uniqueCount * (1 - (a.nullCount / rawRows.length));
            const scoreB = b.uniqueCount * (1 - (b.nullCount / rawRows.length));
            return scoreB - scoreA;
    });
    const measureCol = numberCols.length > 0 ? numberCols[0].name : undefined;

    // Find dimensions
    const dimensions = columns
        .filter(c => c.type === ColumnType.STRING && c.uniqueCount <= 100 && c.uniqueCount < rawRows.length * 0.9)
        .sort((a, b) => a.uniqueCount - b.uniqueCount)
        .map(c => c.name);

    return {
        fileName,
        rows: rawRows,
        columns,
        rowCount: rawRows.length,
        primaryDateColumn: dateCol,
        primaryMeasureColumn: measureCol,
        dimensions
    };
}

const analyzeColumn = (key: string, rows: any[]): ColumnProfile => {
  let nulls = 0;
  const values: any[] = [];
  const distinct = new Set();
  
  let typeCounts = {
    [ColumnType.STRING]: 0,
    [ColumnType.NUMBER]: 0,
    [ColumnType.DATE]: 0,
    [ColumnType.BOOLEAN]: 0,
  };

  // Analyze all rows for accurate unique counts (crucial for PK detection)
  for (const row of rows) {
    const val = row[key];
    if (val === null || val === undefined || val === '') {
      nulls++;
    } else {
      values.push(val);
      distinct.add(val);
      
      if (val instanceof Date) typeCounts[ColumnType.DATE]++;
      else if (typeof val === 'number') typeCounts[ColumnType.NUMBER]++;
      else if (typeof val === 'boolean') typeCounts[ColumnType.BOOLEAN]++;
      else {
          if (!isNaN(Number(val)) && val !== '') typeCounts[ColumnType.NUMBER]++;
          else if (!isNaN(Date.parse(val)) && val.length > 5) typeCounts[ColumnType.DATE]++;
          else typeCounts[ColumnType.STRING]++;
      }
    }
  }

  let type = ColumnType.STRING;
  if (typeCounts[ColumnType.DATE] > values.length * 0.8) type = ColumnType.DATE;
  else if (typeCounts[ColumnType.NUMBER] > values.length * 0.8) type = ColumnType.NUMBER;
  else if (typeCounts[ColumnType.BOOLEAN] > values.length * 0.9) type = ColumnType.BOOLEAN;

  let min, max, sum, mean;
  
  if (type === ColumnType.NUMBER) {
    const numericValues = values.map(v => Number(v)).filter(n => !isNaN(n));
    if (numericValues.length > 0) {
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
        sum = numericValues.reduce((a, b) => a + b, 0);
        mean = sum / numericValues.length;
    }
  } else if (type === ColumnType.DATE) {
     const dates = values.map(v => v instanceof Date ? v.getTime() : new Date(v).getTime()).filter(n => !isNaN(n));
     if (dates.length > 0) {
         min = new Date(Math.min(...dates));
         max = new Date(Math.max(...dates));
     }
  }

  return {
    name: key,
    type,
    nullCount: nulls,
    uniqueCount: distinct.size,
    min,
    max,
    sum,
    mean,
    exampleValues: Array.from(distinct).slice(0, 5) as CellValue[]
  };
};

/**
 * Suggests joins based on heuristics
 */
export const suggestJoins = (baseTableId: string, tables: TableCollection): JoinConfig[] => {
    const suggestions: JoinConfig[] = [];
    const baseTable = tables[baseTableId];
    if (!baseTable) return [];

    const potentialDimensions = Object.values(tables).filter(t => t.id !== baseTableId);

    potentialDimensions.forEach(dimTable => {
        let bestJoin: JoinConfig | null = null;

        // Strategy 1: Exact name match (e.g. 'Customer ID' == 'Customer ID')
        for (const baseCol of baseTable.columns) {
            for (const dimCol of dimTable.columns) {
                // Check if names match (case insensitive)
                if (baseCol.name.toLowerCase() === dimCol.name.toLowerCase()) {
                    // High confidence if the dim column is a likely Primary Key (High uniqueness)
                    const uniqueness = dimCol.uniqueCount / dimTable.rowCount;
                    if (uniqueness > 0.9) {
                        bestJoin = {
                            id: crypto.randomUUID(),
                            rightTableId: dimTable.id,
                            leftColumn: baseCol.name,
                            rightColumn: dimCol.name,
                            joinType: 'LEFT'
                        };
                    }
                }
            }
        }

        // Strategy 2: FK naming convention (e.g. base has 'customer_id', dim is 'customers' and has 'id')
        if (!bestJoin) {
            const dimIdCol = dimTable.columns.find(c => 
                c.name.toLowerCase() === 'id' || 
                c.name.toLowerCase() === `${dimTable.tableName.toLowerCase()}_id` ||
                c.name.toLowerCase() === `${dimTable.tableName.toLowerCase().slice(0, -1)}_id` // customers -> customer_id
            );

            if (dimIdCol && (dimIdCol.uniqueCount / dimTable.rowCount) > 0.9) {
                // Look for matching FK in base table
                const fkName = `${dimTable.tableName.toLowerCase().slice(0, -1)}_id`; // customers -> customer_id
                const matchingBaseCol = baseTable.columns.find(c => 
                    c.name.toLowerCase().includes(dimTable.tableName.toLowerCase()) || 
                    c.name.toLowerCase() === fkName
                );

                if (matchingBaseCol) {
                     bestJoin = {
                        id: crypto.randomUUID(),
                        rightTableId: dimTable.id,
                        leftColumn: matchingBaseCol.name,
                        rightColumn: dimIdCol.name,
                        joinType: 'LEFT'
                    };
                }
            }
        }

        if (bestJoin) {
            suggestions.push(bestJoin);
        }
    });

    return suggestions;
};