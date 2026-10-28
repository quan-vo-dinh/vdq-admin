import { Browser } from '@capacitor/browser';
import { Button } from '@/components/ui/button';
import { apiBase } from './config';
export default function PortfolioWeb(){return <section className="flex flex-col gap-4 p-6"><h1 className="text-2xl font-semibold">Portfolio</h1><p>Portfolio và trình biên tập mở trong trình duyệt. Đăng nhập tài khoản chủ sở hữu trên web để chỉnh sửa.</p><div className="flex flex-wrap gap-3"><Button onClick={()=>void Browser.open({url:apiBase+'/portfolio'})}>Xem portfolio</Button><Button variant="outline" onClick={()=>void Browser.open({url:apiBase+'/apps/portfolio'})}>Mở Portfolio CMS</Button></div></section>;}
