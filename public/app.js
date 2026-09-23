function showShareMessage(message, isError = false) {
    const notice = document.createElement('p');
    notice.textContent = message;
    notice.setAttribute('role', isError ? 'alert' : 'status');
    notice.classList.add( 'share-notice', isError ? 'error' : 'success' );

    const input = document.getElementById('frm_img');
    const container = input ? input.parentElement : document.body;

    container.prepend(notice);

    // Remove the query parameter so refreshing doesn't look
    // like another share operation.
    window.history.replaceState({}, document.title, window.location.pathname);
}

async function loadSharedImage() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('share-error')) {
        const error = params.get('share-error');
        if (error === 'no-image') { 
            showShareMessage('The image could not be received from Android Share.', true);
        } else {
            showShareMessage('Something went wrong while receiving the shared image.', true);
        }

        return;
    }

    if (!params.has('share-target')) {
        return;
    }

    const cache = await caches.open('gitblogscm-share-v1');
    const response = await cache.match('/__shared-image__');

    if (!response) {
        showShareMessage('The image was shared, but gitBlogScm could not retrieve it. Please try sharing the image again.', true);
        return;
    }

    const blob = await response.blob();

    const filename =
        response.headers.get('X-Filename') ||
        'shared-image';

    const file = new File(
        [blob],
        filename,
        {
            type: blob.type || 'image/jpeg'
        }
    );

    const input = document.getElementById('frm_img');

    if (!input) {
        return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    input.files = dataTransfer.files;

    // create feedback on page
    showShareMessage('Image received from Android Share.');

    // clear the cache
    await cache.delete('/__shared-image__');
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    await navigator.serviceWorker.register('/sw.js');
}

window.addEventListener('load', async () => {
    await registerServiceWorker();
    await loadSharedImage();
});
