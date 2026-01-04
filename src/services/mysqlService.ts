import { supabase } from "@/integrations/supabase/client";

export interface MySQLQueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  affectedRows?: number;
  lastInsertId?: number;
}

export interface MySQLTableInfo {
  success: boolean;
  tables?: any[];
  error?: string;
}

export interface MySQLStructureInfo {
  success: boolean;
  structure?: any[];
  error?: string;
}

/**
 * Test MySQL connection
 */
export async function testMySQLConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('mysql-proxy', {
      body: { action: 'test' }
    });

    if (error) {
      console.error('MySQL connection test error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('MySQL connection test failed:', error);
    return { success: false, error: error.message || 'فشل اختبار الاتصال' };
  }
}

/**
 * Execute a SELECT query on MySQL
 */
export async function queryMySQL(query: string, params?: any[]): Promise<MySQLQueryResult> {
  try {
    const { data, error } = await supabase.functions.invoke('mysql-proxy', {
      body: { action: 'query', query, params }
    });

    if (error) {
      console.error('MySQL query error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('MySQL query failed:', error);
    return { success: false, error: error.message || 'فشل تنفيذ الاستعلام' };
  }
}

/**
 * Execute INSERT/UPDATE/DELETE query on MySQL
 */
export async function executeMySQL(query: string, params?: any[]): Promise<MySQLQueryResult> {
  try {
    const { data, error } = await supabase.functions.invoke('mysql-proxy', {
      body: { action: 'execute', query, params }
    });

    if (error) {
      console.error('MySQL execute error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('MySQL execute failed:', error);
    return { success: false, error: error.message || 'فشل تنفيذ الأمر' };
  }
}

/**
 * Get list of tables in MySQL database
 */
export async function getMySQLTables(): Promise<MySQLTableInfo> {
  try {
    const { data, error } = await supabase.functions.invoke('mysql-proxy', {
      body: { action: 'getTables' }
    });

    if (error) {
      console.error('MySQL get tables error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('MySQL get tables failed:', error);
    return { success: false, error: error.message || 'فشل جلب قائمة الجداول' };
  }
}

/**
 * Get table structure
 */
export async function getMySQLTableStructure(tableName: string): Promise<MySQLStructureInfo> {
  try {
    const { data, error } = await supabase.functions.invoke('mysql-proxy', {
      body: { action: 'getTableStructure', params: { tableName } }
    });

    if (error) {
      console.error('MySQL get structure error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error: any) {
    console.error('MySQL get structure failed:', error);
    return { success: false, error: error.message || 'فشل جلب هيكل الجدول' };
  }
}
