export async function onRequest({ request, next }) {
  if (new URL(request.url).hostname === 'admin.mkulimaagricultural.org') {
    return Response.redirect('https://admin.mkulimaagricultural.org/admin/', 302);
  }
  return next();
}
