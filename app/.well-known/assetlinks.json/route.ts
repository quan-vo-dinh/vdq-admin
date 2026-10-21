/** Public certificate binding only. User supplies the final release fingerprint. */
export async function GET() {
 const fingerprint = process.env.ANDROID_SIGNING_SHA256;
 if (!fingerprint || !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(fingerprint)) return Response.json({ code: 'android_links_not_configured' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
 return Response.json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'dev.vodinhquan.dashboard', sha256_cert_fingerprints: [fingerprint] } }], { headers: { 'Cache-Control': 'public, max-age=300' } });
}
