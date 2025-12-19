import { useSettingsStore } from "@/stores/settingsStore";

interface CopyrightFooterProps {
  className?: string;
}

const CopyrightFooter = ({ className = "" }: CopyrightFooterProps) => {
  const { copyrightText, copyrightPhone } = useSettingsStore();

  return (
    <div className={`text-center text-sm text-foreground/60 dark:text-gray-400 ${className}`}>
      <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - {copyrightText}</p>
      <p>{copyrightPhone}</p>
    </div>
  );
};

export default CopyrightFooter;
