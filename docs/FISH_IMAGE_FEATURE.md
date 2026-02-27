# Fish Image Feature

This document describes the new fish image feature added to ReefKeeper.

## Overview

When creating or editing a creature, users can now:
1. **Upload their own photos** from their device's gallery
2. **Search for images online** using the Unsplash API based on the species name

## Configuration

### Unsplash API Setup

To enable online image suggestions, you need to configure an Unsplash API access key:

1. Create a free account at [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application to get your Access Key
3. Add the key to your `.env` file:
   ```
   UNSPLASH_ACCESS_KEY=your-access-key-here
   ```

**Note:** If the Unsplash access key is not configured, users will only be able to upload their own photos. The "Find Images" feature will show an alert that it's unavailable.

### Permissions

For mobile platforms (iOS/Android), the app requires permission to access the device's photo library. The app will automatically request this permission when the user taps "Upload Photo".

## User Interface

### Add/Edit Creature Screen

The image picker component appears between the "Species" field and the "Type" selector:

#### When no image is selected:
- **Upload Photo** button: Opens the device's image picker
- **Find Images** button: Searches Unsplash for images (disabled if species field is empty)

#### When an image is selected:
- **Image preview**: Shows the selected image (200px height)
- **Remove Photo** button: Clears the selected image

#### Image Suggestions Panel (after clicking "Find Images"):
- Shows up to 12 image suggestions from Unsplash
- Displays photographer attribution
- Horizontal scrollable list
- Tap any image to select it
- "Close" button to hide suggestions

## Technical Details

### Component: `ImagePicker.tsx`

Located at: `components/ImagePicker.tsx`

**Props:**
- `value?: string` - The current image URI
- `onChange: (uri: string | undefined) => void` - Callback when image changes
- `species?: string` - The species name for image search

**Features:**
- Uses `expo-image-picker` for local image selection
- Fetches images from Unsplash API with query: `{species} marine fish aquarium`
- Supports both local file URIs and remote URLs
- Shows loading indicator while fetching suggestions
- Handles errors gracefully with user-friendly alerts
- Respects Unsplash guidelines with photographer attribution

### Data Storage

Images are stored by URI in the creature's `photoUri` field:
- **Local images**: Stored as file:// URIs
- **Online images**: Stored as HTTPS URLs to Unsplash CDN

The creature service (`services/creatureService.ts`) already supported the `photoUri` field, so no changes were needed there.

## Testing

### Unit Tests

Located at: `__tests__/components/ImagePicker.test.tsx`

Tests cover:
- Component rendering
- Upload photo flow with permissions
- Image selection and removal
- Button states (enabled/disabled)
- Error handling

Run tests with:
```bash
npm test -- __tests__/components/ImagePicker.test.tsx
```

### Manual Testing

1. **Upload Local Image:**
   - Navigate to add or edit creature screen
   - Enter a name and species
   - Tap "Upload Photo"
   - Grant permission if prompted
   - Select an image from gallery
   - Verify image preview appears
   - Save creature
   - Verify image appears in creature card and detail view

2. **Search Online Images:**
   - Configure Unsplash API key
   - Navigate to add or edit creature screen
   - Enter a species name (e.g., "Clownfish")
   - Tap "Find Images"
   - Verify image suggestions appear
   - Tap an image to select it
   - Verify image preview appears
   - Save creature
   - Verify image appears in creature card and detail view

3. **Remove Image:**
   - Edit a creature with an image
   - Tap "Remove Photo"
   - Verify image is removed
   - Save creature
   - Verify creature no longer has image

## Limitations and Known Issues

1. **Unsplash Rate Limits:**
   - Free tier: 50 requests/hour (demo) or 5,000/hour (production with approval)
   - Consider implementing request caching if needed

2. **Web Platform:**
   - Local file upload works but images are loaded as data URLs
   - Consider implementing server-side storage for production use

3. **Image Quality:**
   - Unsplash images are loaded at "regular" size (1080px)
   - Consider implementing size options for performance

4. **Offline Support:**
   - Online image search requires internet connection
   - Local uploads work offline

## Future Enhancements

Potential improvements for future iterations:

1. **Camera Support:** Add ability to take photos directly
2. **Image Caching:** Cache Unsplash search results
3. **Multiple Images:** Support image galleries
4. **Image Editing:** Allow cropping/filters
5. **Alternative APIs:** Support FishBase or other marine databases
6. **Server Storage:** Upload images to cloud storage instead of storing URIs
