import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e', timeout:45000, expect:{timeout:7500},
 fullyParallel:true, workers:2, retries:0, forbidOnly:!!process.env.CI,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:process.env.RESPONSIVE_BASE_URL||'http://127.0.0.1:8798',locale:'ja-JP',timezoneId:'Asia/Tokyo',serviceWorkers:'block',screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu','--disable-gpu-compositing','--force-color-profile=srgb']}},
 webServer:process.env.RESPONSIVE_BASE_URL?undefined:{command:'npm run serve',url:'http://127.0.0.1:8798',reuseExistingServer:!process.env.CI}
});
