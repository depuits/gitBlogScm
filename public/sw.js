const CACHE_NAME = 'gitblogscm-share-v1';
const SHARED_IMAGE = '/__shared-image__';

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (
        event.request.method !== 'POST' ||
        url.pathname !== '/share-target'
    ) {
        return;
    }

    event.respondWith(handleShareTarget(event.request));
});

async function handleShareTarget(request) {
    try {
        const formData = await request.formData();
        const images = formData.getAll('image');

        const image = images.find(file => file instanceof File);

        if (!image ) {
            return Response.redirect('/?share-error=no-image', 303);
        }

        const cache = await caches.open(CACHE_NAME);

        await cache.put(
            SHARED_IMAGE,
            new Response(image, {
                headers: {
                    'Content-Type': image.type || 'application/octet-stream',
                    'X-Filename': image.name || 'shared-image'
                }
            })
        );

        return Response.redirect('/?share-target', 303);
    } catch (error) {
        console.error('Failed to receive shared image:', error);
        return Response.redirect('/?share-error=receive-failed', 303);
    }
}
