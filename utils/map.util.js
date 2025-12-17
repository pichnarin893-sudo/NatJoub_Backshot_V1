import axios from "axios";

/**
 * Get latitude and longitude from a Google Maps short link
 * Handles:
 *  - @lat,lng (viewport)
 *  - q=lat,lng (query)
 *  - !3dLAT!4dLNG (exact place coordinates)
 */
export async function getLatLong(shortLink) {
    try {
        // Follow redirect manually
        const response = await axios.get(shortLink, {
            maxRedirects: 0,
            validateStatus: null
        });

        let redirectedUrl = response.headers.location;
        if (!redirectedUrl) {
            redirectedUrl = response.request?.res?.responseUrl;
        }

        if (!redirectedUrl) {
            throw new Error("Invalid Google Maps short link");
        }

        // Try to extract exact place coordinates first (!3dLAT!4dLNG)
        let match = redirectedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

        // Fallback to @lat,lng (viewport) or q=lat,lng
        if (!match) {
            match =
                redirectedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                redirectedUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        }

        if (!match) throw new Error("No coordinates found in resolved URL.");

        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);

        return { latitude, longitude };
    } catch (error) {
        console.error("Error fetching lat/long from Google Maps link:", error.message);
        throw error;
    }
}
