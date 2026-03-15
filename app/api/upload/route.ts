// Upload is handled client-side directly to Cloudinary
// using the unsigned "Dentra" preset — no API key needed server-side.
export async function GET() {
  return Response.json({ message: 'Use client-side upload with Dentra preset' })
}
