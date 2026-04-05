## Phased Implementation Plan

### Phase 1: Database Schema (migration)
- Add `watch_history` table (progress tracking, continue watching)
- Add `episodes` table (series/seasons support)
- Add `device_sessions` table (concurrent device limiting for premium)

### Phase 2: Core Features
1. **i18n System** - Language switching (RU/TK/TR) with localStorage persistence
2. **Watch History & Continue Watching** - Save playback position, show "Continue Watching" row on homepage
3. **Series Support** - Seasons/episodes UI in player, auto-play next episode
4. **Favorites** - Already exists as watchlist, just rename/rebrand

### Phase 3: Player Enhancements
5. **Premium Player Features** - Quality selector, subtitle loader, audio track selector (gated behind premium)
6. **Video Preloader** - Loading animation before playback starts
7. **Content Protection** - Disable right-click, prevent direct URL access

### Phase 4: UI/UX Polish
8. **Lazy Loading** - IntersectionObserver for content rows
9. **Mobile Optimization** - Touch gestures, responsive player controls
10. **Recently Added block** - New content section on homepage
11. **Recommendations** - Similar content based on genres

### Phase 5: Premium Features
12. **Device Session Limiting** - Max 2 concurrent sessions for premium users

### Out of Scope (requires infrastructure not available):
- Real CDN setup (needs external CDN provider)
- Actual multi-bitrate transcoding (requires media server)
- Real adaptive streaming (requires HLS/DASH packaging pipeline)
- VPN-free guarantee (depends on content source domains)

These features will be implemented as UI with graceful fallbacks - quality switching will work IF the content source provides multiple streams.