import React, { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@/components/Themeprovider';
import { LanguageProvider } from '@/app/context/language-context';
import DashboardShell from '@/app/(dashboard-layout)/dashboard-shell';
const DeveloperLayout = React.lazy(() => import('@/app/(dashboard-layout)/developer/layout'));
const FinanceLayout = React.lazy(() => import('@/app/(dashboard-layout)/finance/layout'));
import RouteErrorBoundary from '@/app/components/shared/route-error-boundary';
import { routes } from './routes';
import { initSession, verifySession, handleCallback, pauseSession } from './session';
import { configureNativeFiles, nativeListeners, dismissKeyboard, nativeActivity } from './native';
import { Login } from './login';
import '@/app/globals.css';
import '@/app/css/mobile-layout.css';
import './mobile.css';
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist/latin-700.css';
import '@fontsource/geist/vietnamese-400.css';
import '@fontsource/geist/vietnamese-500.css';
import '@fontsource/geist/vietnamese-600.css';
import '@fontsource/geist/vietnamese-700.css';

configureNativeFiles();
function Runtime() {
 const [state, setState] = useState<'loading'|'login'|'ready'|'failed'>('loading');
 const [error, setError] = useState(''), [offline, setOffline] = useState(!navigator.onLine);
 const location = useLocation(), navigate = useNavigate();
 async function start() { try { await initSession(); try { await verifySession(); setState('ready'); } catch { setState('login'); } } catch (e) { setError((e as Error).message); setState('failed'); } }
 useEffect(() => { void initSession().then(() => verifySession().then(() => setState('ready')).catch(() => setState('login'))).catch(e => { setError(e.message); setState('failed'); }); const expire = () => setState('login'); const online = () => setOffline(false), off = () => setOffline(true), fileError = () => setError('Không lưu/chia sẻ được file. Vui lòng thử lại.'); window.addEventListener('session-expired', expire); window.addEventListener('online', online); window.addEventListener('offline', off); window.addEventListener('file-save-error', fileError);
 let cleanup: (() => void) | undefined; let stopped = false;
 void nativeListeners(url => { void initSession().then(() => handleCallback(url)).then(() => setState('ready')).catch(e => { setError(e.message); setState('login'); }); }, () => { void verifySession().then(() => window.dispatchEvent(new Event('focus'))).catch(e => setError(e.message)); }, pauseSession).then(value => { if (stopped) value(); else cleanup = value; }).catch(e => setError(e.message));
 return () => { stopped = true; cleanup?.(); window.removeEventListener('session-expired', expire); window.removeEventListener('online', online); window.removeEventListener('offline', off); window.removeEventListener('file-save-error', fileError); };
 }, []);
 useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;
  const listener = App.addListener('backButton', () => {
   if (dismissKeyboard()) return;
   // Let Base UI dismiss the topmost overlay via its existing Escape contract.
   if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); return; }
   if (window.history.state?.idx > 0) navigate(-1);
   else if (window.confirm('Thoát bin Dashboard?')) void App.exitApp();
  });
  return () => { void listener.then(value => value.remove()); };
 }, [navigate]);
 useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
 if (state === 'loading') return <p role="status" className="p-6">Đang xác minh phiên…</p>;
 if (state === 'failed') return <div role="alert" className="p-6">{error}<button onClick={() => void start()}>Thử lại</button></div>;
 if (state === 'login') return <Login onSuccess={() => { setState('ready'); if (location.pathname.startsWith('/auth/')) navigate('/developer', { replace: true }); }} initialError={error} />;
 return <SWRConfig key="owner" value={{ isVisible: nativeActivity.isVisible, isOnline: nativeActivity.isOnline, provider: () => new Map(), refreshWhenHidden: false, refreshWhenOffline: false, shouldRetryOnError: false }}><DashboardShell>
 {offline && <p role="status" className="sticky top-0 z-50 bg-amber-100 p-3 text-amber-950">Mất mạng. Thay đổi chưa gửi chưa được lưu. Giữ màn hình để bảo toàn bản nháp.</p>}
 {error && <p role="alert" className="p-3 text-destructive">{error}</p>}
 <Suspense fallback={<p role="status" className="p-6">Đang mở màn hình…</p>}><Routes>
 <Route element={<DeveloperLayout><Outlet /></DeveloperLayout>}>{routes.filter(route => route.path.startsWith('/developer')).map(renderRoute)}</Route>
 <Route element={<FinanceLayout><Outlet /></FinanceLayout>}>{routes.filter(route => route.path.startsWith('/finance')).map(renderRoute)}</Route>
 {routes.filter(route => !route.path.startsWith('/developer') && !route.path.startsWith('/finance')).map(renderRoute)}
 <Route path="/auth/auth2/login" element={<Login onSuccess={() => navigate('/developer')} />} />
 <Route path="*" element={<div className="p-6">Không tìm thấy màn hình.<button onClick={() => navigate('/developer')}>Về tổng quan</button></div>} />
 </Routes></Suspense></DashboardShell></SWRConfig>;
}
function renderRoute(route: (typeof routes)[number]) {
 const View = route.Component;
 return <Route key={route.path} path={route.path} element={route.redirect ? <Navigate to={route.redirect} replace /> : View ? <RouteErrorBoundary key={route.path}>{route.template ? <section onSubmitCapture={event => event.preventDefault()}><p role="note" className="p-3 text-muted-foreground">Trang giao diện mẫu. Không đăng ký, cấp quyền hoặc gửi mã xác thực thật.</p><View /></section> : <View />}</RouteErrorBoundary> : null} />;
}
const reactRoot = import.meta.hot?.data.reactRoot ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.reactRoot = reactRoot;
reactRoot.render(<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><LanguageProvider><BrowserRouter><Runtime /></BrowserRouter></LanguageProvider></ThemeProvider>);
