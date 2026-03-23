<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ServeStaticFiles
{
    /**
     * Static file extensions that should be served directly
     */
    private const STATIC_EXTENSIONS = [
        'ico',
        'txt',
        'xml',
        'css',
        'js',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'svg',
        'webp',
        'woff',
        'woff2',
        'ttf',
        'eot',
        'otf',
        'mp4',
        'webm',
        'ogg',
        'map',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Get the request path without query string
        $path = $request->getPathInfo();

        // Check if it's a static file
        if ($this->isStaticFile($path)) {
            return $this->serveStaticFile($path);
        }

        return $next($request);
    }

    /**
     * Determine if the request is for a static file
     */
    private function isStaticFile(string $path): bool
    {
        // Special cases
        if ($path === '/favicon.ico' || $path === '/robots.txt') {
            return true;
        }

        // Check extension
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return in_array($ext, self::STATIC_EXTENSIONS);
    }

    /**
     * Serve the static file
     */
    private function serveStaticFile(string $path)
    {
        $filePath = public_path(ltrim($path, '/'));

        // Security: prevent directory traversal
        $realPath = realpath($filePath);
        $publicPath = realpath(public_path());

        if (!$realPath || !$publicPath || strpos($realPath, $publicPath) !== 0) {
            return response('Not Found', 404);
        }

        // File exists, serve it
        if (file_exists($realPath) && is_file($realPath)) {
            $response = new BinaryFileResponse($realPath);
            $response->setPublic();
            $response->setMaxAge(31536000); // 1 year (in seconds)
            $response->setEtag(hash_file('md5', $realPath));

            // Set proper cache headers
            $response->headers->set('Cache-Control', 'public, immutable, max-age=31536000');

            return $response;
        }

        // Return 404 for missing files
        return response('Not Found', 404);
    }
}
