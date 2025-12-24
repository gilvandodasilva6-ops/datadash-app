import { DataSet, TableCollection, DataModel, DataRow, ColumnProfile, ColumnType } from '../types';

/**
 * Executes the DataModel (Fact + Joins) to produce a single flat DataSet (analysis_view).
 * Uses Hash Joins for O(N) performance on the client side.
 */
export const executeDataModel = (tables: TableCollection, model: DataModel): DataSet => {
  const baseTable = tables[model.baseTableId];
  if (!baseTable) throw new Error("Base table not found");

  // 1. Initialize result with base table rows (cloned shallowly to avoid mutating original)
  let resultRows: DataRow[] = baseTable.rows.map(r => ({ ...r }));
  let resultColumns: ColumnProfile[] = [...baseTable.columns];
  let currentDimensions = [...baseTable.dimensions];

  // 2. Iterate through configured joins
  for (const join of model.joins) {
    const rightTable = tables[join.rightTableId];
    if (!rightTable) continue;

    // A. Build Hash Map for Right Table (Index)
    // Map<JoinKey, RowData>
    const rightMap = new Map<string, DataRow>();
    
    // Check uniqueness for warning (though we proceed anyway)
    // If not unique, the last row wins in a simple Map, which acts like a DISTINCT join on the key
    // For a true 1:N expansion (if Right table is the "Many" side), we'd need a Map<Key, Row[]>.
    // Standard BI modeling assumes we are joining Dimensions (1) to Fact (N), so Right side should be unique (1).
    rightTable.rows.forEach(row => {
        const key = String(row[join.rightColumn]);
        rightMap.set(key, row);
    });

    // B. Prefix columns from Right Table to avoid collisions
    const rightPrefix = rightTable.tableName;
    const rightColsRenamed = rightTable.columns.map(col => ({
        ...col,
        name: `${rightPrefix}.${col.name}`
    }));

    // C. Perform the Join (Iterate Left/Result rows)
    const newRows: DataRow[] = [];
    
    for (const leftRow of resultRows) {
        const key = String(leftRow[join.leftColumn]);
        const rightRow = rightMap.get(key);

        if (rightRow) {
            // Match found
            const mergedRow = { ...leftRow };
            // Merge right columns with prefix
            rightTable.columns.forEach(col => {
                mergedRow[`${rightPrefix}.${col.name}`] = rightRow[col.name];
            });
            newRows.push(mergedRow);
        } else {
            // No match
            if (join.joinType === 'LEFT') {
                const mergedRow = { ...leftRow };
                // Fill nulls
                rightTable.columns.forEach(col => {
                    mergedRow[`${rightPrefix}.${col.name}`] = null;
                });
                newRows.push(mergedRow);
            }
            // If INNER JOIN, we skip this row (filter out)
        }
    }

    resultRows = newRows;
    resultColumns = [...resultColumns, ...rightColsRenamed];
    
    // Add new dimensions found in the right table
    const newDims = rightTable.dimensions.map(d => `${rightPrefix}.${d}`);
    currentDimensions = [...currentDimensions, ...newDims];
  }

  // 3. Re-calculate generic stats for the unified dataset
  // Since specific column stats (min/max/sum) might be preserved, we trust the profile from source tables
  // but rowCount has changed (INNER JOIN) or null counts changed (LEFT JOIN).
  // For simplicity in this version, we update rowCount. 
  // Ideally, we'd re-profile the whole unified view, but that's expensive for large data.
  
  return {
    fileName: `Model: ${baseTable.tableName} + ${model.joins.length} joins`,
    rows: resultRows,
    columns: resultColumns,
    rowCount: resultRows.length,
    primaryDateColumn: baseTable.primaryDateColumn, // Default to base table date
    primaryMeasureColumn: baseTable.primaryMeasureColumn, // Default to base table measure
    dimensions: currentDimensions
  };
};