import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MySQL connection configuration
const mysqlConfig = {
  hostname: "sql105.infinityfree.com",
  username: "if0_40778037",
  password: Deno.env.get("MYSQL_PASSWORD") || "",
  db: "if0_40778037_Go",
  port: 3306,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    const { action, query, params } = await req.json();
    
    console.log("MySQL Proxy action:", action);

    // Create MySQL connection
    client = await new Client().connect(mysqlConfig);
    console.log("Connected to MySQL successfully");

    let result;

    switch (action) {
      case "test":
        // Test connection
        const testResult = await client.query("SELECT 1 as test");
        result = { success: true, message: "اتصال ناجح بقاعدة البيانات", data: testResult };
        break;

      case "query":
        // Execute SELECT query
        if (!query) {
          throw new Error("Query is required");
        }
        const queryResult = await client.query(query, params || []);
        result = { success: true, data: queryResult };
        break;

      case "execute":
        // Execute INSERT/UPDATE/DELETE query
        if (!query) {
          throw new Error("Query is required");
        }
        const executeResult = await client.execute(query, params || []);
        result = { 
          success: true, 
          affectedRows: executeResult.affectedRows,
          lastInsertId: executeResult.lastInsertId 
        };
        break;

      case "getTables":
        // Get list of tables
        const tables = await client.query("SHOW TABLES");
        result = { success: true, tables };
        break;

      case "getTableStructure":
        // Get table structure
        if (!params?.tableName) {
          throw new Error("Table name is required");
        }
        const structure = await client.query(`DESCRIBE ${params.tableName}`);
        result = { success: true, structure };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await client.close();

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("MySQL Proxy Error:", error);
    
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "حدث خطأ في الاتصال بقاعدة البيانات"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
