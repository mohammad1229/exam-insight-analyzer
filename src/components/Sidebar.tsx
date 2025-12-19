
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  to: string;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, label, active }) => {
  return (
    <NavLink to={to} className="w-full">
      {({ isActive }) => (
        <Button
          variant={isActive || active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-right",
            (isActive || active) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          {label}
        </Button>
      )}
    </NavLink>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "h-screen bg-sidebar transition-all duration-300 overflow-y-auto dir-rtl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col p-4">
        <Button
          variant="ghost"
          className="self-end mb-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "»" : "«"}
        </Button>

        <div className="space-y-2">
          {!collapsed && <p className="text-sidebar-foreground text-xs mb-2 px-4">القائمة الرئيسية</p>}
          <SidebarLink to="/dashboard" label={collapsed ? "د" : "الرئيسية"} active={false} />
          <SidebarLink to="/test-results" label={collapsed ? "ن" : "نتائج الاختبارات"} active={false} />
          <SidebarLink to="/reports" label={collapsed ? "ت" : "التقارير"} active={false} />
          <SidebarLink to="/statistics" label={collapsed ? "إح" : "الإحصائيات"} active={false} />
          <SidebarLink to="/admin" label={collapsed ? "إ" : "إدارة النظام"} active={false} />
        </div>
      </div>
      
      {!collapsed && (
        <div className="absolute bottom-4 right-4 left-4 text-center">
          <p className="text-xs text-sidebar-foreground opacity-70">
            جميع الحقوق محفوظة © {new Date().getFullYear()}<br />
            محمد الشوامرة للبرمجة والتصميم<br />
            0566000140
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
