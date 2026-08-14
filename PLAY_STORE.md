# Play Store — SchoolMove Parent & Driver

Both Android apps are configured for Google Play upload.

| App | Play name | Application ID | AAB path |
|-----|-----------|----------------|----------|
| Parent | SchoolMove Parent | `com.schoolmove.parent` | `parent_app/build/app/outputs/bundle/release/app-release.aab` |
| Driver | SchoolMove Driver | `com.schoolmove.driver` | `driver_app/build/app/outputs/bundle/release/app-release.aab` |

Version: `1.0.0` (versionCode `1`) in each `pubspec.yaml`. Bump **both** `1.0.0+1` → `1.0.1+2` for every new upload.

---

## 1. One-time signing (required)

```bash
chmod +x scripts/create-play-keystores.sh scripts/build-play-aabs.sh
./scripts/create-play-keystores.sh
```

This creates (gitignored):

- `parent_app/android/upload-keystore.jks`
- `driver_app/android/upload-keystore.jks`
- `*/android/upload-keystore-credentials.txt`
- signing fields in `android/key.properties`

**Back these up offline.** If the keystore is lost, you cannot update that Play listing.

When creating the Play app, choose **Play App Signing**. Upload the AAB signed with this upload key; Google keeps the app signing key.

---

## 2. Production API (required)

Release builds **refuse** localhost. Use HTTPS:

```bash
export API_BASE_URL=https://YOUR-API-HOST/api/v1
export SOCKET_URL=https://YOUR-API-HOST
# Parent maps (also in parent_app/android/key.properties)
export GOOGLE_MAPS_API_KEY=your_android_maps_key

./scripts/build-play-aabs.sh
```

Restrict the Maps key in Google Cloud to:

- Package `com.schoolmove.parent`
- SHA-1 from `parent_app/android/upload-keystore-credentials.txt`
- Also add your **debug** SHA-1 for local runs

Enable **Maps SDK for Android**.

---

## 3. Privacy policy URLs (required)

Host `admin-web` (or copy these files) and paste the URLs in Play Console:

- Parent: `https://YOUR-ADMIN-HOST/privacy-parent.html`
- Driver: `https://YOUR-ADMIN-HOST/privacy-driver.html`

Files live in `admin-web/public/`.

---

## 4. Store listing copy

### SchoolMove Parent

**Short description (80 chars max)**  
Track your child’s school bus. Live location, ETA, and safety alerts.

**Full description**  
SchoolMove Parent helps you follow your child’s school transport in real time.

• See today’s trip status for each linked child  
• Track the bus on a live map while the trip is active  
• Get ETA to your stop  
• Receive pickup, drop, delay, and emergency alerts  

Children are linked by the school. You cannot add students yourself.

Sign-in is provided by your school.

**Category:** Maps & Navigation (or Education)  
**Tags:** school bus, parent, tracking, ETA

### SchoolMove Driver

**Short description (80 chars max)**  
Start school bus trips and share live location with parents and school.

**Full description**  
SchoolMove Driver is for school transport drivers.

• See your assigned bus and routes  
• Start and end trips  
• Share live GPS with a persistent “trip active” notification  
• Send a transport emergency alert if needed  

Location is used only during an active trip so the school and parents can see the bus.

Sign-in is provided by your school.

**Category:** Maps & Navigation  
**Tags:** school bus, driver, GPS, transport

---

## 5. Graphics (already generated)

Use these in Play Console:

- High-res icon 512×512: `store-assets/play/icon-512.png` (both apps)
- Feature graphic 1024×500: `store-assets/play/feature-graphic.png` (both apps)

**Phone screenshots (required):** at least 2 per app, JPEG/PNG, 16:9 or 9:16.

Capture from a real device or emulator:

Parent: login, home (children + status), live tracking, notifications  
Driver: login, home (route + start trip), active trip

---

## 6. Play Console Data safety

### Parent

| Type | Collected | Shared | Purpose |
|------|-----------|--------|---------|
| Name, email | Yes (account) | With school backend | App functionality |
| Approximate/precise location | No (device GPS not used) | — | — |
| Location of the **bus** | Shown in-app from server | Visible to that parent | App functionality |
| Photos / contacts / ads | No | — | — |

Encryption in transit: Yes  
Users can request deletion via the school admin.

### Driver

| Type | Collected | Shared | Purpose |
|------|-----------|--------|---------|
| Name, email | Yes | School backend | App functionality |
| Precise location | Yes, **only during an active trip** | School staff and parents on that trip | App functionality |
| Approximate location | Yes, derived from GPS during trip | Same | App functionality |
| Ads | No | — | — |

Foreground location with persistent notification. Not used for ads. Not sold.

---

## 7. Permissions declarations

**Parent:** Internet only.

**Driver:**

- Precise location (while using the app) — live trip sharing  
- Notifications — Android 13+ trip-active notification  
- Foreground location service — keep GPS on with screen off during a trip  

Background location permission is **not** requested, which avoids the extra Play “background location” video review.

---

## 8. Upload steps

1. [Google Play Console](https://play.google.com/console) → Create app (twice)
2. Complete store listing, privacy URL, content rating (IARC questionnaire — typically no violence/ads)
3. Target audience: 18+
4. News app / COVID / government: No
5. Production → Create release → **Internal testing** first
6. Upload `app-release.aab` (not APK)
7. Countries, testers, then promote to Closed → Production

Play review for the Driver app will ask why location is needed. Answer: *To share the school bus live location with the school and parents only while a trip is active, using a visible ongoing notification.*

---

## 9. After first upload

Save from Play Console:

- App signing certificate SHA-1 (for Maps / Firebase later)
- Upload key certificate SHA-1

Add **both** SHA-1s to the Android Maps API key restriction.
