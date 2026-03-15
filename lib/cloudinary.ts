// Cloudinary server-side SDK is NOT needed for unsigned uploads.
// All image uploads use the client-side fetch directly to Cloudinary
// with just NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and upload_preset: 'Dentra'
// No API key or API secret required!
export {}
