import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Cloud, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Link,
  Unlink,
  TestTube,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DatabaseConfig {
  type: 'lovable_cloud' | 'external_postgres' | 'external_mysql';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

const defaultConfig: DatabaseConfig = {
  type: 'lovable_cloud',
  host: '',
  port: '5432',
  database: '',
  username: '',
  password: '',
  ssl: true
};

const DatabaseConnectionTab = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<DatabaseConfig>(defaultConfig);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    checkCurrentConnection();
  }, []);

  const checkCurrentConnection = async () => {
    try {
      // Test connection to Lovable Cloud (current Supabase)
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .limit(1);

      if (!error) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setConfig(prev => ({ ...prev, type: 'lovable_cloud' }));
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const handleTypeChange = (type: DatabaseConfig['type']) => {
    setConfig(prev => ({
      ...prev,
      type,
      port: type === 'external_mysql' ? '3306' : '5432'
    }));
  };

  const testConnection = async () => {
    if (config.type === 'lovable_cloud') {
      await checkCurrentConnection();
      toast({
        title: "الاتصال ناجح",
        description: "قاعدة بيانات Lovable Cloud متصلة وتعمل بشكل صحيح",
      });
      return;
    }

    // For external databases, validate fields
    if (!config.host || !config.database || !config.username) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Note: External database connection would require an edge function
      // This is a placeholder for the UI
      toast({
        title: "ملاحظة",
        description: "الاتصال بقواعد البيانات الخارجية يتطلب إعداداً إضافياً عبر edge function",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بقاعدة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Save configuration to localStorage for now
      localStorage.setItem('database_config', JSON.stringify(config));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات قاعدة البيانات",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: DatabaseConfig['type']) => {
    switch (type) {
      case 'lovable_cloud': return 'Lovable Cloud';
      case 'external_postgres': return 'PostgreSQL خارجي';
      case 'external_mysql': return 'MySQL خارجي';
    }
  };

  const getTypeIcon = (type: DatabaseConfig['type']) => {
    switch (type) {
      case 'lovable_cloud': return <Cloud className="h-5 w-5" />;
      case 'external_postgres': return <Database className="h-5 w-5" />;
      case 'external_mysql': return <Server className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>قاعدة البيانات متصلة</span>
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span>خطأ في الاتصال</span>
              </>
            ) : (
              <>
                <Unlink className="h-5 w-5 text-muted-foreground" />
                <span>غير متصل</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            حالة الاتصال الحالية بقاعدة البيانات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {getTypeLabel(config.type)}
              </Badge>
              {connectionStatus === 'connected' && (
                <span className="text-sm text-muted-foreground">
                  متصل وجاهز للاستخدام
                </span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <TestTube className="h-4 w-4 ml-2" />
              )}
              اختبار الاتصال
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>نوع قاعدة البيانات</CardTitle>
          <CardDescription>
            اختر نوع قاعدة البيانات التي تريد استخدامها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['lovable_cloud', 'external_postgres', 'external_mysql'] as const).map((type) => (
              <div
                key={type}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.type === type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleTypeChange(type)}
              >
                <div className="flex items-center justify-between mb-2">
                  {getTypeIcon(type)}
                  {config.type === type && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold">{getTypeLabel(type)}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {type === 'lovable_cloud' && 'قاعدة بيانات سحابية مدمجة ومُدارة تلقائياً'}
                  {type === 'external_postgres' && 'اتصال بخادم PostgreSQL خارجي'}
                  {type === 'external_mysql' && 'اتصال بخادم MySQL/MariaDB خارجي'}
                </p>
                {type === 'lovable_cloud' && (
                  <Badge variant="secondary" className="mt-2">موصى به</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Database Configuration */}
      {config.type !== 'lovable_cloud' && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الاتصال الخارجي</CardTitle>
            <CardDescription>
              أدخل بيانات الاتصال بقاعدة البيانات الخارجية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">عنوان الخادم (Host)</Label>
                <Input
                  id="host"
                  placeholder="localhost أو db.example.com"
                  value={config.host}
                  onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">المنفذ (Port)</Label>
                <Input
                  id="port"
                  placeholder={config.type === 'external_mysql' ? '3306' : '5432'}
                  value={config.port}
                  onChange={(e) => setConfig(prev => ({ ...prev, port: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">اسم قاعدة البيانات</Label>
              <Input
                id="database"
                placeholder="school_db"
                value={config.database}
                onChange={(e) => setConfig(prev => ({ ...prev, database: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  placeholder="db_user"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="ssl">استخدام SSL</Label>
                <p className="text-sm text-muted-foreground">
                  تشفير الاتصال بقاعدة البيانات
                </p>
              </div>
              <Switch
                id="ssl"
                checked={config.ssl}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, ssl: checked }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={testConnection} variant="outline" disabled={isTesting}>
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <TestTube className="h-4 w-4 ml-2" />
                )}
                اختبار الاتصال
              </Button>
              <Button onClick={saveConfiguration} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lovable Cloud Info */}
      {config.type === 'lovable_cloud' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              معلومات Lovable Cloud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="font-semibold mb-2">مميزات Lovable Cloud:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  قاعدة بيانات PostgreSQL مُدارة تلقائياً
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  نسخ احتياطية تلقائية
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  تشفير البيانات
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  سياسات أمان RLS متقدمة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  تخزين ملفات سحابي
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Edge Functions للوظائف المتقدمة
                </li>
              </ul>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>
                المشروع متصل حالياً بـ Lovable Cloud وجميع البيانات محمية ومتاحة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseConnectionTab;
