import { chromium } from 'playwright';
(async () => {
  try {
    const TARGET = process.env.TARGET_URL || 'https://ownercommunity.localhost:1355';
    console.log('TARGET', TARGET);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    console.log('goto', TARGET);
    await page.goto(TARGET, { waitUntil: 'networkidle' });

    const signInSelectors = [
      'text=/sign in/i',
      'text=/sign-in/i',
      'text=/sign ?in/i',
      'button:has-text("Sign in")',
      'a:has-text("Sign in")',
      'a:has-text("Sign in with")',
      'text=/log in/i',
      'a:has-text("Log in")',
      'button:has-text("Log in")'
    ];

    let clicked = false;
    for (const s of signInSelectors) {
      const loc = page.locator(s).first();
      const cnt = await loc.count();
      if (cnt > 0) {
        console.log('Found sign-in selector:', s);
        // Click and wait for either a popup or navigation
        let popup = null;
        try {
          const [maybePopup] = await Promise.all([
            context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
            loc.click({ timeout: 5000 }).catch(() => null),
          ]);
          popup = maybePopup;
        } catch (e) {
          console.log('click/watch error', e);
        }
        if (popup) {
          console.log('Popup opened, waiting for navigation/close');
          try { await popup.waitForLoadState('networkidle', { timeout: 10000 }); } catch(e){}
          // Try to click approval buttons inside popup if present
          const popupBtns = ['button:has-text("Continue")','button:has-text("Allow")','button:has-text("Sign in")','button:has-text("Accept")'];
          for (const b of popupBtns) {
            try {
              const bl = popup.locator(b).first();
              if (await bl.count() > 0) {
                console.log('Clicking popup button', b);
                await bl.click().catch(()=>{});
              }
            } catch(e){}
          }
          try {
            await popup.waitForEvent('close', { timeout: 8000 });
            console.log('popup closed')
          } catch(e) {
            console.log('popup did not close; continuing')
          }
        } else {
          // no popup, wait for possible navigation
          try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch(e){}
        }
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.log('No sign-in element found; taking pre-login screenshot');
      await page.screenshot({ path: '/tmp/playwright_login_pre_retry.png', fullPage: true });
      console.log('NO_SIGNIN_ELEMENT');
      await browser.close();
      process.exit(3);
    }

    // After triggering sign-in, poll for evidence of logged-in UI
    const profileSelectors = [
      'text=/sign out/i',
      'text=/log out/i',
      'text=/profile/i',
      'text=/dashboard/i',
      'header >> text=/welcome/i',
      'text=/my account/i'
    ];

    let verified = false;
    for (let i = 0; i < 30; i++) {
      for (const s of profileSelectors) {
        try {
          if (await page.locator(s).count() > 0) {
            console.log('Verified login via selector:', s);
            verified = true;
            break;
          }
        } catch(e){}
      }
      if (!verified) {
        try {
          if (await page.locator('text="test@example.com"').count() > 0) {
            console.log('Verified login by email presence');
            verified = true;
            break;
          }
        } catch(e){}
      }
      if (verified) break;
      await page.waitForTimeout(1000);
    }

    const outPath = verified ? '/tmp/playwright_login_success_retry.png' : '/tmp/playwright_login_failed_retry.png';
    await page.screenshot({ path: outPath, fullPage: true });
    if (verified) {
      console.log('LOGIN_SUCCESS', outPath);
      await browser.close();
      process.exit(0);
    } else {
      console.log('LOGIN_NOT_VERIFIED', outPath);
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('ERROR', err);
    process.exit(4);
  }
})();
