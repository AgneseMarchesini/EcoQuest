function filterCompatiblePOIs(template, pois, context) {
    return pois.filter(poi => {

        const hasRequiredTags =
            template.requiredTags.every(tag =>
                poi.tags.includes(tag)
            );
        if (!hasRequiredTags) {
            return false;
        }

        if (poi.avgCrowd > 0.8) {
            return false;
        }
        return true;

    });

}

module.exports = filterCompatiblePOIs;
