$content = Get-Content -Path "dist/index.html" -Raw
$old = '<div class="category-grid">\s+<a href="shop.html">Hoodies</a>\s+<a href="shop.html">Outerwear</a>\s+<a href="shop.html">Cargo Pants</a>\s+<a href="shop.html">Accessories</a>\s+</div>'
$new = '<div class="category-grid">
          <a href="shop.html?category=hoodies" style="background-image: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 60%), url(''https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80'');"><span>Hoodies</span></a>
          <a href="shop.html?category=outerwear" style="background-image: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 60%), url(''https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80'');"><span>Outerwear</span></a>
          <a href="shop.html?category=cargo-pants" style="background-image: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 60%), url(''https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80'');"><span>Cargo Pants</span></a>
          <a href="shop.html?category=accessories" style="background-image: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 60%), url(''https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80'');"><span>Accessories</span></a>
        </div>'
$updated = [regex]::Replace($content, $old, $new)
Set-Content -Path "dist/index.html" -Value $updated -Encoding UTF8
