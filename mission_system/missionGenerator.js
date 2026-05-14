function generateMission(template, poi) {

    return {
        text: template.text.replace("{poi}", poi.nome),
        poiId: poi._id,
        templateId: template.id,
        poi,
        template
    };
}

module.exports = generateMission;