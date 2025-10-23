#  How to Test CookieGuard Improvements

## Step 1: Reload the Extension

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Find **CookieGuard** extension
3. Click the **Reload** button (circular arrow icon)
4. The extension is now using the improved detection code

## Step 2: Test with the Test Page

1. Open the file: `test-page.html` in your browser
2. Open **DevTools** (Press `F12`)
3. Go to the **Console** tab
4. Look for colored messages starting with `[CookieGuard]`

### Expected Console Output:

```
[CookieGuard] Content script loaded
[CookieGuard] Running initial detection...
[CookieGuard] Starting detection...
[CookieGuard] Found 1 cookie banner(s)
[CookieGuard] Detected 5 violations
```

You should also see a **table** showing which violations were detected (true/false for each).

## Step 3: Check the Extension Popup

1. Click the **CookieGuard** extension icon in your browser toolbar
2. You should see:
   - A compliance score (less than 100 if violations detected)
   - Dark pattern score
   - Compliance issues count
   - List of detected violations

## Step 4: Check the Badge

- The extension icon should have a **red badge** showing the number of violations
- Or a **green ✓** if no violations

## Step 5: Test on Real Websites

Try visiting websites known to have cookie banners:
- https://www.theguardian.com
- https://www.bbc.com
- https://www.cnn.com
- Any Norwegian news site

Check the console and popup for each.

## Troubleshooting

### If you see "No data from background, using example data":
- The content script might not be running
- Try refreshing the webpage
- Check if the extension has permissions for that site

### If nothing appears in console:
1. Make sure the extension is enabled
2. Try reloading both the extension AND the webpage
3. Check `chrome://extensions/` for any errors

### If the popup shows old data:
- Close and reopen the popup
- The data refreshes each time you open it

Happy testing! 
