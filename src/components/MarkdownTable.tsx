'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MarkdownTableProps {
  headers: string[];
  rows: string[][];
  itemsPerPage?: number;
  propertyId?: string;
  propertyName?: string;
}

// Format number with proper locale formatting
function formatNumber(value: string): string {
  // Trim whitespace
  const trimmed = value.trim();
  
  // IMPORTANT: Check for dates FIRST before checking for integers
  // Check if it's a date (YYYYMMDD format) - must be exactly 8 digits
  if (/^\d{8}$/.test(trimmed)) {
    const year = trimmed.slice(0, 4);
    const month = trimmed.slice(4, 6);
    const day = trimmed.slice(6, 8);
    // Validate it's a reasonable date (year 2000-2100, month 01-12, day 01-31)
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    if (yearNum >= 2000 && yearNum <= 2100 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      // Verify the date is valid
      if (date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
  }
  
  // Check if it's an integer (but not an 8-digit date)
  // Also handle numbers that might already have commas
  const cleanValue = trimmed.replace(/,/g, '');
  if (/^\d+$/.test(cleanValue)) {
    return parseInt(cleanValue).toLocaleString('en-US');
  }
  
  // Check if it's a decimal
  if (/^\d+\.\d+$/.test(cleanValue)) {
    const num = parseFloat(cleanValue);
    // Format percentages (0-1 range)
    if (num >= 0 && num <= 1 && num.toString().includes('.')) {
      return `${(num * 100).toFixed(2)}%`;
    }
    // Format large decimals
    if (num >= 1000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  return trimmed;
}

// Check if a value is numeric (including dates)
function isNumeric(value: string): boolean {
  const trimmed = value.trim();
  
  // Check for 8-digit dates first
  if (/^\d{8}$/.test(trimmed)) {
    const year = parseInt(trimmed.slice(0, 4));
    const month = parseInt(trimmed.slice(4, 6));
    const day = parseInt(trimmed.slice(6, 8));
    // Validate it's a reasonable date
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return true; // It's a date, treat as numeric for formatting
    }
  }
  // Check for regular numbers (handle numbers with commas)
  const cleanValue = trimmed.replace(/,/g, '');
  return /^\d+(\.\d+)?$/.test(cleanValue);
}

export function MarkdownTable({ headers, rows, itemsPerPage = 10, propertyId, propertyName }: MarkdownTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = useMemo(() => rows.slice(startIndex, endIndex), [rows, startIndex, endIndex]);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  
  return (
    <div 
      className="my-8 inline-block overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl"
      style={{
        marginTop: '2rem',
        marginBottom: '2rem',
        width: 'auto',
        maxWidth: '100%',
        overflow: 'hidden',
        borderRadius: '1rem',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Beautiful Table Header */}
      <div 
        className="border-b border-gray-200/60 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-3"
        style={{
          borderBottom: '1px solid rgba(229, 231, 235, 0.6)',
          background: 'linear-gradient(to right, #eef2ff, #faf5ff, #fdf2f8)',
          padding: '0.75rem 1.5rem',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                <path
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {propertyName ? propertyName : 'Data Table'}
                {propertyId && !propertyName && ` (${propertyId})`}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-gray-600">
                {propertyId && propertyName && `Property ID: ${propertyId} • `}
                {totalPages > 1 
                  ? `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} (Page ${currentPage} of ${totalPages})`
                  : `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`
                } • {headers.length} columns
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable table container */}
      <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
        <Table className="border-collapse" style={{ borderCollapse: 'collapse', width: 'auto' }}>
          <TableHeader className="bg-gradient-to-b from-gray-50 to-white" style={{ background: 'linear-gradient(to bottom, #f9fafb, white)' }}>
            <TableRow className="border-b-2 border-gray-200/80" style={{ borderBottom: '2px solid rgba(229, 231, 235, 0.8)' }}>
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className="text-xs font-bold uppercase tracking-widest text-gray-700 bg-gray-50/50 first:rounded-tl-lg last:rounded-tr-lg"
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#374151',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{header}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, rowIndex) => {
              const actualRowIndex = startIndex + rowIndex;
              return (
              <TableRow 
                key={actualRowIndex}
                className={`border-b border-gray-100/80 transition-all duration-150 ${
                  actualRowIndex % 2 === 0 
                    ? 'bg-white hover:bg-indigo-50/30' 
                    : 'bg-gray-50/40 hover:bg-indigo-50/40'
                } hover:shadow-sm`}
                style={{
                  borderBottom: '1px solid rgba(243, 244, 246, 0.8)',
                  backgroundColor: actualRowIndex % 2 === 0 ? 'white' : 'rgba(249, 250, 251, 0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {row.map((cell, cellIndex) => {
                  // Check if this column is a date column
                  const isDateColumn = headers[cellIndex]?.toLowerCase().includes('date') || 
                                      headers[cellIndex]?.toLowerCase() === 'date';
                  
                  // For date columns, always try to format as date first
                  let formattedValue = cell;
                  let isNumericCell = false;
                  
                  if (isDateColumn && /^\d{8}$/.test(cell)) {
                    // It's a date column and the value is 8 digits - format as date
                    formattedValue = formatNumber(cell);
                    isNumericCell = true;
                  } else {
                    // Regular formatting
                    isNumericCell = isNumeric(cell);
                    formattedValue = isNumericCell ? formatNumber(cell) : cell;
                  }
                  
                  return (
                    <TableCell 
                      key={cellIndex} 
                      className={`text-sm transition-colors ${
                        isNumericCell 
                          ? 'font-mono text-right font-semibold text-gray-900' 
                          : 'text-left font-medium text-gray-700'
                      }`}
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        textAlign: isNumericCell ? 'right' : 'left',
                        fontFamily: isNumericCell ? 'monospace' : 'inherit',
                        fontWeight: isNumericCell ? '600' : '500',
                        color: isNumericCell ? '#111827' : '#374151',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isNumericCell ? (
                        <span 
                          className="inline-flex items-center rounded-md bg-indigo-50/50 px-2 py-1 font-semibold text-indigo-900"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '0.375rem',
                            backgroundColor: 'rgba(238, 242, 255, 0.5)',
                            padding: '0.25rem 0.5rem',
                            fontWeight: '600',
                            color: '#312e81',
                          }}
                        >
                          {formattedValue}
                        </span>
                      ) : (
                        <span className="break-words leading-relaxed" style={{ wordBreak: 'break-word', lineHeight: '1.625' }}>
                          {formattedValue}
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div 
          className="border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white px-6 py-3"
          style={{
            borderTop: '1px solid rgba(229, 231, 235, 0.6)',
            background: 'linear-gradient(to right, rgba(249, 250, 251, 0.8), white)',
            padding: '0.75rem 1.5rem',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Results info */}
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#9ca3af' }}>
                  <path
                    d="M7 1.75L9.5 5.25L13 6.5L10.5 9.75L10.75 13.25L7 11.75L3.25 13.25L3.5 9.75L1 6.5L4.5 5.25L7 1.75Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                Showing {startIndex + 1}-{Math.min(endIndex, rows.length)} of {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#9ca3af' }}>
                  <path
                    d="M2 2H12M2 7H12M2 12H12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {headers.length} columns
              </span>
            </div>
            
            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-sm font-medium text-gray-500"
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  
                  const pageNum = page as number;
                  const isActive = pageNum === currentPage;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderRadius: '0.5rem',
                        backgroundColor: isActive ? '#4f46e5' : 'white',
                        color: isActive ? 'white' : '#374151',
                        border: isActive ? 'none' : '1px solid #d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Table Footer (when no pagination) */}
      {totalPages === 1 && (
        <div 
          className="border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white px-6 py-3"
          style={{
            borderTop: '1px solid rgba(229, 231, 235, 0.6)',
            background: 'linear-gradient(to right, rgba(249, 250, 251, 0.8), white)',
            padding: '0.75rem 1.5rem',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#9ca3af' }}>
                  <path
                    d="M7 1.75L9.5 5.25L13 6.5L10.5 9.75L10.75 13.25L7 11.75L3.25 13.25L3.5 9.75L1 6.5L4.5 5.25L7 1.75Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                Total: {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#9ca3af' }}>
                  <path
                    d="M2 2H12M2 7H12M2 12H12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {headers.length} columns
              </span>
            </div>
            <div className="text-xs font-medium text-gray-500">
              GA4 Analytics Data
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Parses markdown text and extracts tables
 */
export function parseMarkdownTables(text: string): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  
  // Split text into lines
  const lines = text.split('\n');
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let headerRowIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // If we have a table in progress and hit an empty line, finalize it
      if (currentTable && currentTable.headers.length > 0 && currentTable.rows.length > 0) {
        tables.push(currentTable);
        currentTable = null;
        headerRowIndex = -1;
      }
      continue;
    }
    
    // Check if line starts with | (markdown table row)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Parse cells from the row - handle edge cases
      const cells = line
        .slice(1, -1) // Remove leading and trailing |
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0 || true); // Keep empty cells too
      
      // Check if this is a separator row (all cells are dashes/colons)
      const isSeparator = cells.every(c => /^[-:\s]+$/.test(c));
      
      if (isSeparator) {
        // This is the separator row, the previous row was headers
        if (headerRowIndex === i - 1 && currentTable) {
          // Headers are already parsed, continue
          continue;
        }
      } else {
        // Check if next line is a separator (this might be header row)
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const nextIsSeparator = nextLine.startsWith('|') && nextLine.endsWith('|') && 
                                nextLine.slice(1, -1).split('|').map(c => c.trim()).every(c => /^[-:\s]+$/.test(c));
        
        if (nextIsSeparator && !currentTable) {
          // This is a header row, start a new table
          currentTable = {
            headers: cells,
            rows: []
          };
          headerRowIndex = i;
          i++; // Skip the separator row
          continue;
        } else if (currentTable) {
          // This is a data row
          // Ensure row has same number of cells as headers
          if (cells.length === currentTable.headers.length) {
            currentTable.rows.push(cells);
          } else if (cells.length > 0) {
            // Pad or truncate to match headers
            const paddedCells = [...cells];
            while (paddedCells.length < currentTable.headers.length) {
              paddedCells.push('');
            }
            currentTable.rows.push(paddedCells.slice(0, currentTable.headers.length));
          }
        }
      }
    } else {
      // Non-table line - finalize current table if exists
      if (currentTable && currentTable.headers.length > 0 && currentTable.rows.length > 0) {
        tables.push(currentTable);
        currentTable = null;
        headerRowIndex = -1;
      }
    }
  }
  
  // Finalize any remaining table
  if (currentTable && currentTable.headers.length > 0 && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Replaces markdown tables in text with placeholders and returns both
 */
export function extractTablesFromMarkdown(text: string): {
  textWithoutTables: string;
  tables: Array<{ headers: string[]; rows: string[][] }>;
} {
  const tables = parseMarkdownTables(text);
  let textWithoutTables = text;
  
  // Replace tables with placeholders by finding table blocks
  // Match: header row | separator row | data rows
  const lines = text.split('\n');
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  let currentTableIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      const isSeparator = cells.every(c => /^[-:\s]+$/.test(c));
      
      if (!isSeparator && tableStartIndex === -1) {
        // Check if next line is separator (potential header)
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine.startsWith('|') && nextLine.endsWith('|')) {
          const nextCells = nextLine.slice(1, -1).split('|').map(c => c.trim());
          if (nextCells.every(c => /^[-:\s]+$/.test(c))) {
            tableStartIndex = i;
          }
        }
      } else if (tableStartIndex !== -1 && !isSeparator) {
        // Continue collecting table rows
        tableEndIndex = i;
      } else if (tableStartIndex !== -1 && !line.startsWith('|')) {
        // End of table
        if (currentTableIndex < tables.length && tableEndIndex > tableStartIndex) {
          const tableBlock = lines.slice(tableStartIndex, tableEndIndex + 1).join('\n');
          textWithoutTables = textWithoutTables.replace(tableBlock, `[TABLE_${currentTableIndex}]`);
          currentTableIndex++;
        }
        tableStartIndex = -1;
        tableEndIndex = -1;
      }
    } else if (tableStartIndex !== -1) {
      // End of table (non-table line)
      if (currentTableIndex < tables.length && tableEndIndex > tableStartIndex) {
        const tableBlock = lines.slice(tableStartIndex, tableEndIndex + 1).join('\n');
        textWithoutTables = textWithoutTables.replace(tableBlock, `[TABLE_${currentTableIndex}]`);
        currentTableIndex++;
      }
      tableStartIndex = -1;
      tableEndIndex = -1;
    }
  }
  
  // Handle table at end of text
  if (tableStartIndex !== -1 && currentTableIndex < tables.length && tableEndIndex > tableStartIndex) {
    const tableBlock = lines.slice(tableStartIndex, tableEndIndex + 1).join('\n');
    textWithoutTables = textWithoutTables.replace(tableBlock, `[TABLE_${currentTableIndex}]`);
  }
  
  return { textWithoutTables, tables };
}

