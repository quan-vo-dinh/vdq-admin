'use client'
import { HeadingText } from "@/app/components/shared/heading-text";
import { Button } from '@/components/ui/button';
import { RefreshCcw, Download, Sun, Sunset, MoonStar } from 'lucide-react';
import { useLanguage } from '@/app/context/language-context';
import { usePersonalGreeting } from '@/app/components/shared/personalized-intro';


export default function OverviewTab({ onRefresh, onExport, busy = false }: {
  onRefresh: () => void;
  onExport: () => void;
  busy?: boolean;
}) {
  const { t } = useLanguage();
  const greeting = usePersonalGreeting();
  const getGreetingIcon = () => {
    if (greeting.period === 0) return <Sun size={25} className="text-amber-500" aria-hidden="true" />;
    if (greeting.period === 1) return <Sun size={25} className="text-orange-500" aria-hidden="true" />;
    if (greeting.period === 2) return <Sunset size={25} className="text-rose-500" aria-hidden="true" />;
    if (greeting.period === 3) return <MoonStar size={25} className="text-indigo-400" aria-hidden="true" />;
    return null;
  };



  return (
    <>
      <div className="flex items-center flex-wrap lg:flex-nowrap lg:gap-0 gap-4 justify-between">
        <div className='flex flex-col items-start'>
          <h1 className="text-xl flex items-center gap-2"><HeadingText>
            {greeting.title} <span className="flex items-center">{getGreetingIcon()}</span>
          </HeadingText></h1>
          <p className='text-sm font-normal text-muted-foreground'>{greeting.subtitle}</p>
        </div>
        <div className="flex items-center lg:flex-nowrap flex-wrap gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={busy} aria-label={t("Refresh")} className={"p-2.5 h-auto outline rounded-lg cursor-pointer"}>
            <RefreshCcw size={16} />
          </Button>
          <Button onClick={onExport} disabled={busy} className="flex items-center gap-1.5 h-auto px-4 py-2 rounded-lg cursor-pointer">
            <Download size={16} />
            <span className="text-sm font-medium">{t('Export')}</span>
          </Button>
        </div>
      </div>
    </>
  );
}
