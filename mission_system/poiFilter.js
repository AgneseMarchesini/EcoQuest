function filterCompatiblePOIs(template, pois, context) {
    return pois.filter(poi => {

        const hasRequiredTags = template.requiredTags.every(tag => {
            return poi.categoria && poi.categoria.includes(tag);
        });
        if (!hasRequiredTags) {
            return false;
        }

        if (poi.avgCrowd > 0.9) {
            return false;
        }
        return true;

    });

}

module.exports = filterCompatiblePOIs;
