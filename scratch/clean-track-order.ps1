$content = Get-Content -Path "dist/track-order.html" -Raw
$old = '<form class="form-panel"><input placeholder="#ZAV-2026-1048" aria-label="Order number"><input placeholder="Email address" aria-label="Email address"><button class="primary-cta" type="button">Track Order</button></form>\s*</div>\s*<div class="tracking-card">[\s\S]*?</ol>\s*</div>'
$new = '<form class="form-panel"><input placeholder="Order number (ZVR-123456)" aria-label="Order number"><input placeholder="Email address" aria-label="Email address"><button class="primary-cta" type="button">Track Order</button></form>
        </div>
        <div class="tracking-card">
          <h2>Order Tracking</h2>
          <p>Enter your order number and email above to view real-time delivery status.</p>
        </div>'
$updated = [regex]::Replace($content, $old, $new)
Set-Content -Path "dist/track-order.html" -Value $updated -Encoding UTF8
